// 성경 모드 설정 파일
export const BIBLE_CONFIG = {
  // 구약 성경 39권
  OLD_TESTAMENT: [
    { id: 1, name: "창세기", korean: "창", english: "Genesis", abbr: "Gen" },
    { id: 2, name: "출애굽기", korean: "출", english: "Exodus", abbr: "Exo" },
    { id: 3, name: "레위기", korean: "레", english: "Leviticus", abbr: "Lev" },
    { id: 4, name: "민수기", korean: "민", english: "Numbers", abbr: "Num" },
    {
      id: 5,
      name: "신명기",
      korean: "신",
      english: "Deuteronomy",
      abbr: "Deu",
    },
    { id: 6, name: "여호수아", korean: "수", english: "Joshua", abbr: "Jos" },
    { id: 7, name: "사사기", korean: "삿", english: "Judges", abbr: "Jdg" },
    { id: 8, name: "룻기", korean: "룻", english: "Ruth", abbr: "Rut" },
    {
      id: 9,
      name: "사무엘상",
      korean: "삼상",
      english: "1 Samuel",
      abbr: "1Sa",
    },
    {
      id: 10,
      name: "사무엘하",
      korean: "삼하",
      english: "2 Samuel",
      abbr: "2Sa",
    },
    {
      id: 11,
      name: "열왕기상",
      korean: "왕상",
      english: "1 Kings",
      abbr: "1Ki",
    },
    {
      id: 12,
      name: "열왕기하",
      korean: "왕하",
      english: "2 Kings",
      abbr: "2Ki",
    },
    {
      id: 13,
      name: "역대상",
      korean: "대상",
      english: "1 Chronicles",
      abbr: "1Ch",
    },
    {
      id: 14,
      name: "역대하",
      korean: "대하",
      english: "2 Chronicles",
      abbr: "2Ch",
    },
    { id: 15, name: "에스라", korean: "스", english: "Ezra", abbr: "Ezr" },
    {
      id: 16,
      name: "느헤미야",
      korean: "느",
      english: "Nehemiah",
      abbr: "Neh",
    },
    { id: 17, name: "에스더", korean: "에", english: "Esther", abbr: "Est" },
    { id: 18, name: "욥기", korean: "욥", english: "Job", abbr: "Job" },
    { id: 19, name: "시편", korean: "시", english: "Psalms", abbr: "Psa" },
    { id: 20, name: "잠언", korean: "잠", english: "Proverbs", abbr: "Pro" },
    {
      id: 21,
      name: "전도서",
      korean: "전",
      english: "Ecclesiastes",
      abbr: "Ecc",
    },
    {
      id: 22,
      name: "아가",
      korean: "아",
      english: "Song of Songs",
      abbr: "Son",
    },
    { id: 23, name: "이사야", korean: "사", english: "Isaiah", abbr: "Isa" },
    {
      id: 24,
      name: "예레미야",
      korean: "렘",
      english: "Jeremiah",
      abbr: "Jer",
    },
    {
      id: 25,
      name: "예레미야애가",
      korean: "애",
      english: "Lamentations",
      abbr: "Lam",
    },
    { id: 26, name: "에스겔", korean: "겔", english: "Ezekiel", abbr: "Eze" },
    { id: 27, name: "다니엘", korean: "단", english: "Daniel", abbr: "Dan" },
    { id: 28, name: "호세아", korean: "호", english: "Hosea", abbr: "Hos" },
    { id: 29, name: "요엘", korean: "욜", english: "Joel", abbr: "Joe" },
    { id: 30, name: "아모스", korean: "암", english: "Amos", abbr: "Amo" },
    { id: 31, name: "오바댜", korean: "옵", english: "Obadiah", abbr: "Oba" },
    { id: 32, name: "요나", korean: "욘", english: "Jonah", abbr: "Jon" },
    { id: 33, name: "미가", korean: "미", english: "Micah", abbr: "Mic" },
    { id: 34, name: "나훔", korean: "나", english: "Nahum", abbr: "Nah" },
    { id: 35, name: "하박국", korean: "합", english: "Habakkuk", abbr: "Hab" },
    { id: 36, name: "스바냐", korean: "습", english: "Zephaniah", abbr: "Zep" },
    { id: 37, name: "학개", korean: "학", english: "Haggai", abbr: "Hag" },
    { id: 38, name: "스가랴", korean: "슥", english: "Zechariah", abbr: "Zec" },
    { id: 39, name: "말라기", korean: "말", english: "Malachi", abbr: "Mal" },
  ],

  // 신약 성경 27권
  NEW_TESTAMENT: [
    { id: 40, name: "마태복음", korean: "마", english: "Matthew", abbr: "Mat" },
    { id: 41, name: "마가복음", korean: "막", english: "Mark", abbr: "Mar" },
    { id: 42, name: "누가복음", korean: "눅", english: "Luke", abbr: "Luk" },
    { id: 43, name: "요한복음", korean: "요", english: "John", abbr: "Joh" },
    { id: 44, name: "사도행전", korean: "행", english: "Acts", abbr: "Act" },
    { id: 45, name: "로마서", korean: "롬", english: "Romans", abbr: "Rom" },
    {
      id: 46,
      name: "고린도전서",
      korean: "고전",
      english: "1 Corinthians",
      abbr: "1Co",
    },
    {
      id: 47,
      name: "고린도후서",
      korean: "고후",
      english: "2 Corinthians",
      abbr: "2Co",
    },
    {
      id: 48,
      name: "갈라디아서",
      korean: "갈",
      english: "Galatians",
      abbr: "Gal",
    },
    {
      id: 49,
      name: "에베소서",
      korean: "엡",
      english: "Ephesians",
      abbr: "Eph",
    },
    {
      id: 50,
      name: "빌립보서",
      korean: "빌",
      english: "Philippians",
      abbr: "Phi",
    },
    {
      id: 51,
      name: "골로새서",
      korean: "골",
      english: "Colossians",
      abbr: "Col",
    },
    {
      id: 52,
      name: "데살로니가전서",
      korean: "살전",
      english: "1 Thessalonians",
      abbr: "1Th",
    },
    {
      id: 53,
      name: "데살로니가후서",
      korean: "살후",
      english: "2 Thessalonians",
      abbr: "2Th",
    },
    {
      id: 54,
      name: "디모데전서",
      korean: "딤전",
      english: "1 Timothy",
      abbr: "1Ti",
    },
    {
      id: 55,
      name: "디모데후서",
      korean: "딤후",
      english: "2 Timothy",
      abbr: "2Ti",
    },
    { id: 56, name: "디도서", korean: "딛", english: "Titus", abbr: "Tit" },
    {
      id: 57,
      name: "빌레몬서",
      korean: "몬",
      english: "Philemon",
      abbr: "Phm",
    },
    { id: 58, name: "히브리서", korean: "히", english: "Hebrews", abbr: "Heb" },
    { id: 59, name: "야고보서", korean: "약", english: "James", abbr: "Jam" },
    {
      id: 60,
      name: "베드로전서",
      korean: "벧전",
      english: "1 Peter",
      abbr: "1Pe",
    },
    {
      id: 61,
      name: "베드로후서",
      korean: "벧후",
      english: "2 Peter",
      abbr: "2Pe",
    },
    {
      id: 62,
      name: "요한일서",
      korean: "요일",
      english: "1 John",
      abbr: "1Jo",
    },
    {
      id: 63,
      name: "요한이서",
      korean: "요이",
      english: "2 John",
      abbr: "2Jo",
    },
    {
      id: 64,
      name: "요한삼서",
      korean: "요삼",
      english: "3 John",
      abbr: "3Jo",
    },
    { id: 65, name: "유다서", korean: "유", english: "Jude", abbr: "Jud" },
    {
      id: 66,
      name: "요한계시록",
      korean: "계",
      english: "Revelation",
      abbr: "Rev",
    },
  ],

  // 게임 모드 설정
  GAME_MODES: {
    OLD_TESTAMENT: {
      id: "old",
      name: "구약 성경",
      description: "구약 39권으로 타워 쌓기",
      books: 39,
      color: "#8B4513", // 갈색 계열
      bgColor: "#F4E4BC",
    },
    NEW_TESTAMENT: {
      id: "new",
      name: "신약 성경",
      description: "신약 27권으로 타워 쌓기",
      books: 27,
      color: "#4169E1", // 파란색 계열
      bgColor: "#E6F3FF",
    },
  },

  // 이미지 매핑 설정
  IMAGE_MAPPING: {
    // 구름/배경 이미지를 성경 관련 이미지로 매핑
    BACKGROUND_IMAGES: {
      OLD_TESTAMENT: [
        "temple1",
        "temple2",
        "altar1",
        "altar2",
        "mountain1",
        "mountain2",
        "desert1",
        "desert2",
      ],
      NEW_TESTAMENT: [
        "church1",
        "church2",
        "cross1",
        "cross2",
        "dove1",
        "dove2",
        "light1",
        "light2",
      ],
    },
    // 비행 오브젝트를 성경 관련 이미지로 매핑
    FLIGHT_IMAGES: {
      OLD_TESTAMENT: [
        "dove",
        "eagle",
        "angel1",
        "cloud",
        "fire",
        "rainbow",
        "star",
      ],
      NEW_TESTAMENT: [
        "dove",
        "angel2",
        "star",
        "light",
        "crown",
        "fish",
        "lamb",
      ],
    },
  },
};

// 모드별 성경책 가져오기 함수
export const getBibleBooks = (mode) => {
  return mode === "old"
    ? BIBLE_CONFIG.OLD_TESTAMENT
    : BIBLE_CONFIG.NEW_TESTAMENT;
};

// 특정 인덱스의 성경책 정보 가져오기
export const getBibleBook = (mode, index) => {
  const books = getBibleBooks(mode);
  return books[index] || null;
};

// 모드 정보 가져오기
export const getGameMode = (mode) => {
  return mode === "old"
    ? BIBLE_CONFIG.GAME_MODES.OLD_TESTAMENT
    : BIBLE_CONFIG.GAME_MODES.NEW_TESTAMENT;
};
