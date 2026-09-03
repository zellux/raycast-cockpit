import { getPreferenceValues } from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collectSnapshot } from "./collectors";
import type { ModulePreferences, NetworkHistory, StatusSnapshot } from "./types";

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
  const [networkHistory, setNetworkHistory] = useState<NetworkHistory>({ download: [], upload: [] });
  const [isLoading, setIsLoading] = useState(true);
  const running = useRef(false);

  const refresh = useCallback(
    async (forceCodex = false) => {
      if (running.current) return;
      running.current = true;
      try {
        const nextSnapshot = await collectSnapshot(modulePreferences, forceCodex);
        setSnapshot(nextSnapshot);
        if (nextSnapshot.network?.ready) {
          setNetworkHistory((previous) => {
            const history =
              previous.interfaceName === nextSnapshot.network?.interfaceName ? previous : { download: [], upload: [] };
            return {
              interfaceName: nextSnapshot.network?.interfaceName,
              download: [...history.download, nextSnapshot.network?.downloadBytesPerSecond ?? 0].slice(-18),
              upload: [...history.upload, nextSnapshot.network?.uploadBytesPerSecond ?? 0].slice(-18),
            };
          });
        }
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

  return { snapshot, networkHistory, isLoading, refresh, preferences };
}
