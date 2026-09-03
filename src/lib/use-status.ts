import { getPreferenceValues } from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collectSnapshot } from "./collectors";
import type { ModulePreferences, StatusSnapshot } from "./types";

export function useStatusSnapshot() {
  const preferences = getPreferenceValues<Preferences>();
  const modulePreferences = useMemo<ModulePreferences>(
    () => ({
      showCpu: preferences.showCpu,
      showMemory: preferences.showMemory,
      showDisk: preferences.showDisk,
      showNetwork: preferences.showNetwork,
      showBattery: preferences.showBattery,
      showCodex: preferences.showCodex,
      networkUnits: preferences.networkUnits,
      codexPath: preferences.codexPath,
    }),
    [preferences],
  );
  const [snapshot, setSnapshot] = useState<StatusSnapshot>();
  const [isLoading, setIsLoading] = useState(true);
  const running = useRef(false);

  const refresh = useCallback(
    async (forceCodex = false) => {
      if (running.current) return;
      running.current = true;
      try {
        setSnapshot(await collectSnapshot(modulePreferences, forceCodex));
      } finally {
        running.current = false;
        setIsLoading(false);
      }
    },
    [modulePreferences],
  );

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), Math.max(2, Number(preferences.dashboardRefreshSeconds)) * 1000);
    return () => clearInterval(interval);
  }, [preferences.dashboardRefreshSeconds, refresh]);

  return { snapshot, isLoading, refresh, preferences };
}
