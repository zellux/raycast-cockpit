import { getPreferenceValues } from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collectSnapshot } from "./collectors";
import type { ModulePreferences, NetworkHistory, StatusSnapshot } from "./types";

interface StatusState {
  snapshot?: StatusSnapshot;
  networkHistory: NetworkHistory;
}

export function useStatusSnapshot({ minimumPublishIntervalSeconds = 0 } = {}) {
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
  const networkHistoryRef = useRef<NetworkHistory>({ download: [], upload: [] });
  const lastPublishedAt = useRef(0);

  const refresh = useCallback(
    async (forceCodex = false) => {
      if (running.current) return;
      running.current = true;
      try {
        const nextSnapshot = await collectSnapshot(modulePreferences, forceCodex);
        if (nextSnapshot.network?.ready) {
          const history =
            networkHistoryRef.current.interfaceName === nextSnapshot.network.interfaceName
              ? networkHistoryRef.current
              : { download: [], upload: [] };
          networkHistoryRef.current = {
            interfaceName: nextSnapshot.network.interfaceName,
            download: [...history.download, nextSnapshot.network.downloadBytesPerSecond].slice(-18),
            upload: [...history.upload, nextSnapshot.network.uploadBytesPerSecond].slice(-18),
          };
        }

        const publishIntervalSeconds = Math.max(
          minimumPublishIntervalSeconds,
          Number(preferences.dashboardRefreshSeconds),
        );
        const shouldPublish =
          forceCodex ||
          lastPublishedAt.current === 0 ||
          Date.now() - lastPublishedAt.current >= publishIntervalSeconds * 1000;
        if (shouldPublish) {
          lastPublishedAt.current = Date.now();
          setState({ snapshot: nextSnapshot, networkHistory: networkHistoryRef.current });
        }
      } finally {
        running.current = false;
        setIsLoading(false);
      }
    },
    [minimumPublishIntervalSeconds, modulePreferences, preferences.dashboardRefreshSeconds],
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
