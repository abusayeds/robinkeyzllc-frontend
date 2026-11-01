"use client";


import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./api/baseApi";
import uiReducer from "./features/uiSlice";
import leagueReducer from "./features/leagueSlice";
import teamReducer from "./features/teamSlice";
import transactionsReducer from "./features/transactionsSlice";
import rostersReducer from "./features/rostersSlice";
import tradeReducer from "./features/tradeSlice";
import freeAgencyReducer from "./features/freeAgencySlice";
import draftReducer from "./features/draftSlice";
import newsReducer from "./features/newsSlice";
import authReducer from "./features/authSlice";
import activeLeagueReducer from "./features/activeLeagueSlice";
import draftPicksReducer from "./features/draftPicksSlice";
import settingsReducer from "./features/settingsSlice";
import platformReducer from "./features/platformSlice";

const AUTH_STORAGE_KEY = "avora.auth";

function loadPersistedAuth() {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return undefined;
    const saved = JSON.parse(raw);
    // Older builds stored the auth slice on its own, so a saved shape with no
    // auth key is read as the auth slice itself.
    const state = saved?.auth ? saved : { auth: saved };
    return state as {
      auth: ReturnType<typeof authReducer>;
      activeLeague: ReturnType<typeof activeLeagueReducer>;
    };
  } catch {
    return undefined;
  }
} 
export const makeStore = () => {
  const store = configureStore({
    reducer: {
      ui: uiReducer,
      league: leagueReducer,
      team: teamReducer,
      transactions: transactionsReducer,
      rosters: rostersReducer,
      trade: tradeReducer,
      freeAgency: freeAgencyReducer,
      draft: draftReducer,
      news: newsReducer,
      auth: authReducer,
      activeLeague: activeLeagueReducer,
      draftPicks: draftPicksReducer,
      settings: settingsReducer,
      platform: platformReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    preloadedState: loadPersistedAuth(),
    // RTK Query keeps its cache and its request lifecycle in middleware, so
    // the store will not serve any endpoint without this line.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  setupListeners(store.dispatch);

  if (typeof window !== "undefined") {
    store.subscribe(() => {
      try {
        const state = store.getState();
        const { isAuthenticated, token, user, role } = state.auth;
        window.localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({
            auth: { isAuthenticated, token, user, role },
            activeLeague: state.activeLeague,
          }),
        );
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
