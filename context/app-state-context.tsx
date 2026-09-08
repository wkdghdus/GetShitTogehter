"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getLocalDate } from "../lib/dates";
import {
  ensureDailyEntry,
  exportAppState,
  hydrateAppState,
  importAppState,
  resetAppState,
  saveAppState,
} from "../lib/storage";
import type { AppState, DailyEntry } from "../lib/types";

interface AppStateContextValue {
  state: AppState | null;
  today: DailyEntry | null;
  todayDate: string;
  isHydrated: boolean;
  setState: (updater: AppState | ((state: AppState) => AppState)) => void;
  updateToday: (updater: (entry: DailyEntry) => DailyEntry) => void;
  resetState: () => void;
  exportState: () => string;
  importState: (json: string) => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setStateValue] = useState<AppState | null>(null);
  const [todayDate] = useState(() => getLocalDate());

  useEffect(() => {
    setStateValue(hydrateAppState(todayDate));
  }, [todayDate]);

  const setState = useCallback((updater: AppState | ((state: AppState) => AppState)) => {
    setStateValue((current) => {
      const base = current ?? hydrateAppState();
      const next = typeof updater === "function" ? updater(base) : updater;
      return saveAppState(next);
    });
  }, []);

  const updateToday = useCallback(
    (updater: (entry: DailyEntry) => DailyEntry) => {
      setState((current) => {
        const withToday = ensureDailyEntry(current, todayDate);
        const today = withToday.dailyEntries[todayDate];

        return {
          ...withToday,
          dailyEntries: {
            ...withToday.dailyEntries,
            [todayDate]: updater(today),
          },
        };
      });
    },
    [setState, todayDate],
  );

  const resetState = useCallback(() => {
    setStateValue(resetAppState());
  }, []);

  const importState = useCallback((json: string) => {
    setStateValue(importAppState(json));
  }, []);

  const exportState = useCallback(() => {
    return exportAppState(state ?? hydrateAppState(todayDate));
  }, [state, todayDate]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      today: state?.dailyEntries[todayDate] ?? null,
      todayDate,
      isHydrated: state !== null,
      setState,
      updateToday,
      resetState,
      exportState,
      importState,
    }),
    [exportState, importState, resetState, setState, state, todayDate, updateToday],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider.");
  }

  return context;
}
