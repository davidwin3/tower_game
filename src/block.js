import {
  getMoveDownValue,
  getLandBlockVelocity,
  getSwingBlockVelocity,
  touchEventHandler,
  addSuccessCount,
  addFailedCount,
  addScore,
} from "./utils";
import * as constant from "./constant";
import { getBibleBook } from "../bible-config.js";

const checkCollision = (block, line) => {
  // 0 goon 1 drop 2 rotate left 3 rotate right 4 ok 5 perfect
  if (block.y + block.height >= line.y) {
    if (
      block.x < line.x - block.calWidth ||
      block.x > line.collisionX + block.calWidth
    ) {
      return 1;
    }
    if (block.x < line.x) {
      return 2;
    }
    if (block.x > line.collisionX) {
      return 3;
    }
    if (
      block.x > line.x + block.calWidth * 0.8 &&
      block.x < line.x + block.calWidth * 1.2
    ) {
      // -10% +10%
      return 5;
    }
    return 4;
  }
  return 0;
};
const swing = (instance, engine, time) => {
  const ropeHeight = engine.getVariable(constant.ropeHeight);
  if (instance.status !== constant.swing) return;
  const i = instance;
  const initialAngle = engine.getVariable(constant.initialAngle);
  i.angle = initialAngle * getSwingBlockVelocity(engine, time);
  i.weightX = i.x + Math.sin(i.angle) * ropeHeight;
  i.weightY = i.y + Math.cos(i.angle) * ropeHeight;
};

const checkBlockOut = (instance, engine) => {
  if (instance.status === constant.rotateLeft) {
    // 左转 要等右上角消失才算消失
    if (instance.y - instance.width >= engine.height) {
      instance.visible = false;
      instance.status = constant.out;
      addFailedCount(engine);
    }
  } else if (instance.y >= engine.height) {
    instance.visible = false;
    instance.status = constant.out;
    addFailedCount(engine);
  }
};

export const blockAction = (instance, engine, time) => {
  const i = instance;
  const ropeHeight = engine.getVariable(constant.ropeHeight);
  if (!i.visible) {
    return;
  }
  if (!i.ready) {
    i.ready = true;
    i.status = constant.swing;
    instance.updateWidth(engine.getVariable(constant.blockWidth));
    instance.updateHeight(engine.getVariable(constant.blockHeight));
    instance.x = engine.width / 2;
    instance.y = ropeHeight * -1.5;

    // 블럭 생성 시 성경 정보 저장 (이 블럭이 성공하면 몇 번째 성경책이 될지)
    const currentSuccessCount = engine.getVariable(constant.successCount);
    const gameMode = engine.getVariable(constant.gameMode);
    const maxBooks = engine.getVariable(constant.maxBooks);
    // 이 블럭이 성공하면 successCount가 1 증가하므로, 그 값을 기준으로 성경 순서 결정
    const nextSuccessCount = currentSuccessCount + 1;
    const relativeIndex = ((nextSuccessCount - 1) % maxBooks) + 1;
    // 모드에 따라 bookIndex 계산: 구약(1-39), 신약(40-66)
    const bookIndex =
      gameMode === "old" ? relativeIndex : 40 + (relativeIndex - 1);
    instance.bibleBookIndex = bookIndex;
    instance.bibleBookName = getBibleBookInfo(gameMode, bookIndex);

    // 디버깅용 로그
    console.log(
      `블럭 생성: currentSuccessCount=${currentSuccessCount}, nextSuccessCount=${nextSuccessCount}, bookIndex=${bookIndex}, bookName=${instance.bibleBookName}`
    );
  }
  const line = engine.getInstance("line");
  switch (i.status) {
    case constant.swing:
      engine.getTimeMovement(
        constant.hookDownMovement,
        [[instance.y, instance.y + ropeHeight]],
        (value) => {
          instance.y = value;
        },
        {
          name: "block",
        }
      );
      swing(instance, engine, time);
      break;
    case constant.beforeDrop:
      i.x = instance.weightX - instance.calWidth;
      i.y = instance.weightY + 0.3 * instance.height; // add rope height
      i.rotate = 0;
      i.ay = engine.pixelsPerFrame(0.0003 * engine.height); // acceleration of gravity
      i.startDropTime = time;
      i.status = constant.drop;
      break;
    case constant.drop:
      const deltaTime = time - i.startDropTime;
      i.startDropTime = time;
      i.vy += i.ay * deltaTime;
      i.y += i.vy * deltaTime + 0.5 * i.ay * deltaTime ** 2;
      const collision = checkCollision(instance, line);
      const blockY = line.y - instance.height;
      const calRotate = (ins) => {
        ins.originOutwardAngle = Math.atan(ins.height / ins.outwardOffset);
        ins.originHypotenuse = Math.sqrt(
          ins.height ** 2 + ins.outwardOffset ** 2
        );
        engine.playAudio("rotate");
      };
      switch (collision) {
        case 1:
          checkBlockOut(instance, engine);
          break;
        case 2:
          i.status = constant.rotateLeft;
          instance.y = blockY;
          instance.outwardOffset = line.x + instance.calWidth - instance.x;
          calRotate(instance);
          break;
        case 3:
          i.status = constant.rotateRight;
          instance.y = blockY;
          instance.outwardOffset =
            line.collisionX + instance.calWidth - instance.x;
          calRotate(instance);
          break;
        case 4:
        case 5:
          i.status = constant.land;
          const lastSuccessCount = engine.getVariable(constant.successCount);
          addSuccessCount(engine);

          // 성공적으로 착지했을 때 성경 정보 최종 확정
          const currentSuccessCount = engine.getVariable(constant.successCount);
          const gameMode = engine.getVariable(constant.gameMode);
          const maxBooks = engine.getVariable(constant.maxBooks);
          const relativeIndex = ((currentSuccessCount - 1) % maxBooks) + 1;
          // 모드에 따라 bookIndex 계산: 구약(1-39), 신약(40-66)
          const finalBookIndex =
            gameMode === "old" ? relativeIndex : 40 + (relativeIndex - 1);
          instance.bibleBookIndex = finalBookIndex;
          instance.bibleBookName = getBibleBookInfo(gameMode, finalBookIndex);

          console.log(
            `블럭 착지 성공: ${instance.name}, finalSuccessCount=${currentSuccessCount}, finalBookIndex=${finalBookIndex}, finalBookName=${instance.bibleBookName}`
          );

          engine.setTimeMovement(constant.moveDownMovement, 500);
          if (lastSuccessCount === 10 || lastSuccessCount === 15) {
            engine.setTimeMovement(constant.lightningMovement, 150);
          }
          instance.y = blockY;
          line.y = blockY;
          line.x = i.x - i.calWidth;
          line.collisionX = line.x + i.width;
          // 作弊检测 超出左边或右边1／3
          const cheatWidth = i.width * 0.3;
          if (i.x > engine.width - cheatWidth * 2 || i.x < -cheatWidth) {
            engine.setVariable(constant.hardMode, true);
          }
          if (collision === 5) {
            instance.perfect = true;
            addScore(engine, true);
            engine.playAudio("drop-perfect");
          } else {
            addScore(engine);
            engine.playAudio("drop");
          }
          break;
        default:
          break;
      }
      break;
    case constant.land:
      engine.getTimeMovement(
        constant.moveDownMovement,
        [
          [
            instance.y,
            instance.y +
              getMoveDownValue(engine, { pixelsPerFrame: (s) => s / 2 }),
          ],
        ],
        (value) => {
          if (!instance.visible) return;
          instance.y = value;
          if (instance.y > engine.height) {
            instance.visible = false;
          }
        },
        {
          name: instance.name,
        }
      );
      instance.x += getLandBlockVelocity(engine, time);
      break;
    case constant.rotateLeft:
    case constant.rotateRight:
      const isRight = i.status === constant.rotateRight;
      const rotateSpeed = engine.pixelsPerFrame(Math.PI * 4);
      const isShouldFall = isRight
        ? instance.rotate > 1.3
        : instance.rotate < -1.3; // 75度
      const leftFix = isRight ? 1 : -1;
      if (isShouldFall) {
        instance.rotate += (rotateSpeed / 8) * leftFix;
        instance.y += engine.pixelsPerFrame(engine.height * 0.7);
        instance.x += engine.pixelsPerFrame(engine.width * 0.3) * leftFix;
      } else {
        let rotateRatio =
          (instance.calWidth - instance.outwardOffset) / instance.calWidth;
        rotateRatio = rotateRatio > 0.5 ? rotateRatio : 0.5;
        instance.rotate += rotateSpeed * rotateRatio * leftFix;
        const angle = instance.originOutwardAngle + instance.rotate;
        const rotateAxisX = isRight
          ? line.collisionX + instance.calWidth
          : line.x + instance.calWidth;
        const rotateAxisY = line.y;
        instance.x = rotateAxisX - Math.cos(angle) * instance.originHypotenuse;
        instance.y = rotateAxisY - Math.sin(angle) * instance.originHypotenuse;
      }
      checkBlockOut(instance, engine);
      break;
    default:
      break;
  }
};

const drawSwingBlock = (instance, engine) => {
  const blockX = instance.weightX - instance.calWidth;
  const blockY = instance.weightY;

  // blockRope 이미지 그리기
  const bl = engine.getImg("blockRope");
  engine.ctx.drawImage(
    bl,
    blockX,
    blockY,
    instance.width,
    instance.height * 1.3
  );

  // 성경책 이미지와 텍스트 표시
  const bookIndex = instance.bibleBookIndex || 1;
  const bookName = instance.bibleBookName || "창세기";
  const bibleImg = engine.getImg(`bible-${bookIndex}`);

  if (bibleImg) {
    // 성경책 이름 텍스트 표시
    drawBibleText(
      engine.ctx,
      blockX,
      blockY,
      instance.width,
      instance.height * 1.6,
      bookName
    );
  }

  const leftX = blockX;
  engine.debugLineY(leftX);
};

// 성경책 정보 가져오기
const getBibleBookInfo = (gameMode, bookIndex) => {
  // 모드에 따라 배열 인덱스 계산: 구약(1-39 → 0-38), 신약(40-66 → 0-26)
  const arrayIndex = gameMode === "old" ? bookIndex - 1 : bookIndex - 40;
  const book = getBibleBook(gameMode, arrayIndex);
  return book
    ? book.name
    : `${gameMode === "old" ? "구약" : "신약"} ${bookIndex}`;
};

// 성경책 이름 텍스트 그리기 공통 함수
const drawBibleText = (ctx, x, y, width, height, bookName) => {
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = width * 0.04;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 텍스트가 블록 폭을 넘지 않도록 폰트 크기 자동 조정
  const maxTextWidth = width * 0.9; // 블록 폭의 90%를 사용 가능한 텍스트 영역으로 설정
  const minFontSize = 15;
  let fontSize = Math.max(minFontSize, width * 0.22); // 초기 폰트 크기

  // 텍스트 너비를 측정하고 폰트 크기 조정
  ctx.font = `${fontSize}px Arial`;
  let textWidth = ctx.measureText(bookName).width;

  // 텍스트가 블록 폭을 넘으면 폰트 크기를 줄이며 반복
  while (textWidth > maxTextWidth && fontSize > minFontSize) {
    fontSize -= 1;
    ctx.font = `${fontSize}px Arial`;
    textWidth = ctx.measureText(bookName).width;
  }

  const textX = x + width / 2;
  const textY = y + height / 2;

  // 텍스트 외곽선
  ctx.strokeText(bookName, textX, textY);
  // 텍스트 채우기
  ctx.fillText(bookName, textX, textY);
  ctx.restore();
};

const drawBlock = (instance, engine) => {
  const { perfect } = instance;

  // 블럭 생성 시 저장된 성경 정보 사용
  const bookIndex = instance.bibleBookIndex || 1;
  const bookName = instance.bibleBookName || "창세기";
  const bibleImg = engine.getImg(`bible-${bookIndex}`);

  // 디버깅용 로그 - 블럭이 그려질 때마다 정보 출력
  console.log(
    `블럭 그리기: ${instance.name}, bookIndex=${bookIndex}, bookName=${bookName}`
  );

  if (bibleImg) {
    // 성경책 이미지가 있으면 사용
    engine.ctx.drawImage(
      bibleImg,
      instance.x,
      instance.y,
      instance.width,
      instance.height
    );

    // 완벽한 착지 시 효과 추가
    if (perfect) {
      const { ctx } = engine;
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#FFD700"; // 금색 효과
      ctx.fillRect(instance.x, instance.y, instance.width, instance.height);
      ctx.restore();
    }

    // 성경책 이름 표시
    drawBibleText(
      engine.ctx,
      instance.x,
      instance.y,
      instance.width,
      instance.height,
      bookName
    );
  } else {
    // 기본 블록 이미지 사용 (fallback)
    const bl = engine.getImg(perfect ? "block-perfect" : "block");
    engine.ctx.drawImage(
      bl,
      instance.x,
      instance.y,
      instance.width,
      instance.height
    );
  }
};

const drawRotatedBlock = (instance, engine) => {
  const { ctx } = engine;
  ctx.save();
  ctx.translate(instance.x, instance.y);
  ctx.rotate(instance.rotate);
  ctx.translate(-instance.x, -instance.y);
  drawBlock(instance, engine);
  ctx.restore();
};

export const blockPainter = (instance, engine) => {
  const { status } = instance;
  switch (status) {
    case constant.swing:
      drawSwingBlock(instance, engine);
      break;
    case constant.drop:
    case constant.land:
      drawBlock(instance, engine);
      break;
    case constant.rotateLeft:
    case constant.rotateRight:
      drawRotatedBlock(instance, engine);
      break;
    default:
      break;
  }
};
