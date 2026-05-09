type Listener = () => void;

export type ExternalStore<State> = {
  getState: () => State;
  setState: (updater: State | ((current: State) => State)) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createStore<State>(initialState: State): ExternalStore<State> {
  let state = initialState;
  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState: (updater) => {
      state = typeof updater === "function" ? (updater as (current: State) => State)(state) : updater;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
