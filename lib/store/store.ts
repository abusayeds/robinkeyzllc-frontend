"use client";

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./api/baseApi";
import uiReducer from "./features/uiSlice";

import authReducer, { authInitialState } from "./features/authSlice";
import activeLeagueReducer, {
  activeLeagueInitialState,
} from "./features/activeLeagueSlice";

import platformReducer, {
  platformInitialState,
  type AdminViewingLeague,
} from "./features/platformSlice";

const AUTH_STORAGE_KEY = "avora.auth";

/**
 * What a reload has to keep.
 *
 * Server data is left out, because every query refetches it, and screen state
 * is left out, because it should start fresh. `adminViewingLeague` is in here
 * because it is not screen state: it is the league a Super Admin is standing
 * in, and the sidebar, the header and the bottom nav all read it to decide
 * which shell to draw. Leaving it out emptied the whole league view on reload.
 */
type Persisted = {
  auth: ReturnType<typeof authReducer>;
  activeLeague: ReturnType<typeof activeLeagueReducer>;
  platform: { adminViewingLeague: AdminViewingLeague | null };
};

function loadPersistedState() {
  if (typeof window === "undefined") return undefined;

  let saved: Partial<Persisted> | undefined;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    // Older builds stored the auth slice on its own, so a saved shape with no
    // auth key is read as the auth slice itself.
    saved = parsed?.auth ? parsed : { auth: parsed };
  } catch {
    return undefined;
  }
  if (!saved?.auth) return undefined;

  // Every slice is merged onto its own initial state, never substituted for
  // it. `preloadedState` replaces a slice wholesale, so anything saved by an
  // older build — with fewer fields, or a different shape — would otherwise
  // leave holes in the store that only show up as a crash somewhere else.
  return {
    auth: { ...authInitialState, ...saved.auth },
    activeLeague: {
      ...activeLeagueInitialState,
      ...(saved.activeLeague ?? {}),
    },
    platform: {
      ...platformInitialState,
      adminViewingLeague: saved.platform?.adminViewingLeague ?? null,
    },
  };
}

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      ui: uiReducer,

      auth: authReducer,
      activeLeague: activeLeagueReducer,

      platform: platformReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    preloadedState: loadPersistedState(),
    // RTK Query keeps its cache and its request lifecycle in middleware, so
    // the store will not serve any endpoint without this line.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  setupListeners(store.dispatch);

  if (typeof window !== "undefined") {
    // One query dispatches several actions, so the snapshot is compared against
    // the last one written instead of writing on each of them.
    let written = "";
    store.subscribe(() => {
      try {
        const state = store.getState();
        const { isAuthenticated, token, user, role } = state.auth;
        const snapshot = JSON.stringify({
          auth: { isAuthenticated, token, user, role },
          activeLeague: state.activeLeague,
          platform: { adminViewingLeague: state.platform.adminViewingLeague },
        } satisfies Persisted);

        if (snapshot === written) return;
        window.localStorage.setItem(AUTH_STORAGE_KEY, snapshot);
        written = snapshot;
      } catch {
        // ignore write failures (private mode, quota, etc.)
      }
    });
  }

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
