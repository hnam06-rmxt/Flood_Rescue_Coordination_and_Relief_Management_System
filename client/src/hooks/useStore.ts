import { useCallback, useRef, useSyncExternalStore } from "react";
import type { ExternalStore } from "../utils/createStore";

export function useStore<State, Selected>(
  store: ExternalStore<State>,
  selector: (state: State) => Selected,
): Selected {
  const selectorRef = useRef(selector);
  const selectedRef = useRef<Selected | undefined>(undefined);
  const stateRef = useRef<State | undefined>(undefined);

  selectorRef.current = selector;

  const getSnapshot = useCallback(() => {
    const nextState = store.getState();
    // Only recompute if the underlying state object changed
    if (stateRef.current !== nextState || selectedRef.current === undefined) {
      stateRef.current = nextState;
      selectedRef.current = selectorRef.current(nextState);
    }
    return selectedRef.current;
  }, [store]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}
