// Centralized game state — replaces engine.setVariable / engine.getVariable
export const state = {};

export const setState = (key, value) => {
  state[key] = value;
};

export const getState = (key, defaultValue) => {
  if (key in state) return state[key];
  return defaultValue;
};

export const resetState = () => {
  Object.keys(state).forEach(k => delete state[k]);
};
