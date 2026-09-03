import { getPreferenceValues } from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collectSnapshot } from "./collectors";
import type { ModulePreferences, NetworkHistory, StatusSnapshot } from "./types";

interface StatusState {
  snapshot?: StatusSnapshot;
  networkHistory: NetworkHistory;
}

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
  const [state, setState] = useState<StatusState>({ networkHistory: { download: [], upload: [] } });
  const [isLoading, setIsLoading] = useState(true);
  const running = useRef(false);

  const refresh = useCallback(
    async (forceCodex = false) => {
      if (running.current) return;
      running.current = true;
      try {
        const nextSnapshot = await collectSnapshot(modulePreferences, forceCodex);
        setState((previous) => {
          if (!nextSnapshot.network?.ready) return { ...previous, snapshot: nextSnapshot };
          const history =
            previous.networkHistory.interfaceName === nextSnapshot.network.interfaceName
              ? previous.networkHistory
              : { download: [], upload: [] };
          return {
            snapshot: nextSnapshot,
            networkHistory: {
              interfaceName: nextSnapshot.network.interfaceName,
              download: [...history.download, nextSnapshot.network.downloadBytesPerSecond].slice(-18),
              upload: [...history.upload, nextSnapshot.network.uploadBytesPerSecond].slice(-18),
            },
          };
        });
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

  return {
    snapshot: state.snapshot,
    networkHistory: state.networkHistory,
    isLoading,
    refresh,
    preferences,
  };
}
