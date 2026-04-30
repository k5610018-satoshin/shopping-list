const listeners = new Set();

export const state = {
  user: null,
  householdId: null,
  items: [],
  tab: 'home',
  search: '',
  ready: false,
  authMessage: null,
  toast: null,
};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  for (const fn of listeners) fn(state);
}

export function setState(patch) {
  Object.assign(state, patch);
  notify();
}

export function showToast(text, ms = 2500) {
  setState({ toast: { text, id: Date.now() } });
  setTimeout(() => {
    if (state.toast && Date.now() - state.toast.id >= ms) {
      setState({ toast: null });
    }
  }, ms);
}
