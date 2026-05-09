import { useSyncExternalStore } from "react";
import type { ExternalStore } from "../utils/createStore";

export function useStore<State, Selected>(
  store: ExternalStore<State>,
  selector: (state: State) => Selected,
): Selected {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()), () => selector(store.getState()));
}
