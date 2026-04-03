/**
 * Tween system — replaces cooljs engine.setTimeMovement / getTimeMovement / checkTimeMovement
 *
 * cooljs pattern:
 *   engine.setTimeMovement(key, durationMs)          → starts / restarts a tween
 *   engine.checkTimeMovement(key)                    → true while active
 *   engine.getTimeMovement(key, ranges, cb, opts)    → interpolates; opts.name lets
 *                                                       multiple callers share one tween
 *                                                       with independent start values
 */

const tweens = {};

/** Start (or restart) a named tween. */
export const setTween = (key, durationMs) => {
  tweens[key] = {
    duration: durationMs,
    startTime: null,   // set on first getTimeMovement call
    active: true,
    callers: {},       // name → { startVals, endVals, beforeFired }
    afterFns: [],      // collected after-callbacks
  };
};

/** True while the tween is still running. */
export const checkTween = (key) => !!(tweens[key] && tweens[key].active);

/**
 * Drive the tween forward and interpolate ranges for one named caller.
 *
 * @param {string}   key      Tween key
 * @param {number}   now      Current timestamp (ms, from accumulated ticker.deltaMS)
 * @param {Array}    ranges   [[start, end], ...] — captured on first call for this name
 * @param {Function} onValue  Called with interpolated value of ranges[0]
 * @param {Object}   options  { name?, before?, after? }
 * @returns {boolean}         true while active
 */
export const getTween = (key, now, ranges, onValue, options = {}) => {
  const t = tweens[key];
  if (!t || !t.active) return false;

  // Mark start time on very first caller
  if (t.startTime === null) t.startTime = now;

  const elapsed  = now - t.startTime;
  const progress = Math.min(elapsed / t.duration, 1);
  const callerName = options.name || '__default__';

  // Capture ranges once per named caller
  if (ranges && ranges.length > 0 && !t.callers[callerName]) {
    t.callers[callerName] = {
      startVals: ranges.map(r => r[0]),
      endVals:   ranges.map(r => r[1]),
      beforeFired: false,
    };
  }

  const caller = t.callers[callerName];

  // Fire before() once
  if (caller && !caller.beforeFired && options.before) {
    options.before();
    caller.beforeFired = true;
  } else if (!caller && !t._globalBeforeFired && options.before) {
    options.before();
    t._globalBeforeFired = true;
  }

  // Interpolate and call onValue
  if (caller && onValue) {
    const value = caller.startVals[0] + (caller.endVals[0] - caller.startVals[0]) * progress;
    onValue(value);
  }

  // Collect after callbacks
  if (options.after && !t.afterFns.includes(options.after)) {
    t.afterFns.push(options.after);
  }

  if (progress >= 1) {
    t.active    = false;
    t.startTime = null;
    t.callers   = {};
    t._globalBeforeFired = false;
    t.afterFns.forEach(fn => fn());
    t.afterFns  = [];
    return false;
  }
  return true;
};

/** Remove a tween entirely. */
export const removeTween = (key) => { delete tweens[key]; };
