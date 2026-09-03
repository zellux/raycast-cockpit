import {
  Color,
  getPreferenceValues,
  Icon,
  Keyboard,
  launchCommand,
  LaunchType,
  MenuBarExtra,
  openExtensionPreferences,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { collectSnapshot } from "./lib/collectors";
import { formatBytes, formatRate, formatResetTime, formatWindowName, remainingPercent } from "./lib/format";
import type { ModulePreferences, StatusSnapshot } from "./lib/types";

function modulePreferences(preferences: Preferences): ModulePreferences {
  return {
    showCpu: preferences.showCpu,
    showMemory: preferences.showMemory,
    showDisk: preferences.showDisk,
    showNetwork: preferences.showNetwork,
    showBattery: preferences.showBattery,
    showCodex: preferences.showCodex,
    networkUnits: preferences.networkUnits,
    codexPath: preferences.codexPath,
  };
}

function primaryTitle(snapshot: StatusSnapshot | undefined, preferences: Preferences): string | undefined {
  if (!snapshot || preferences.menuBarPrimary === "icon") return undefined;
  if (preferences.menuBarPrimary === "network" && snapshot.network?.ready) {
    return `↓${formatRate(snapshot.network.downloadBytesPerSecond, preferences.networkUnits)} ↑${formatRate(snapshot.network.uploadBytesPerSecond, preferences.networkUnits)}`;
  }
  if (preferences.menuBarPrimary === "cpu" && snapshot.cpu) return `CPU ${snapshot.cpu.percent}%`;
  if (preferences.menuBarPrimary === "memory" && snapshot.memory) return `MEM ${snapshot.memory.percent}%`;
  if (preferences.menuBarPrimary === "codex" && snapshot.codex?.limits[0]?.primary) {
    return `GPT ${remainingPercent(snapshot.codex.limits[0].primary)}%`;
  }
  return undefined;
}

export default function MenuBar() {
  const preferences = getPreferenceValues<Preferences>();
  const { data, isLoading, revalidate } = useCachedPromise(
    async () => collectSnapshot(modulePreferences(preferences)),
    [],
    { keepPreviousData: true },
  );

  return (
    <MenuBarExtra
      icon={{ source: Icon.Gauge, tintColor: Object.keys(data?.errors ?? {}).length ? Color.Yellow : undefined }}
      title={primaryTitle(data, preferences)}
      tooltip="Status Dashboard"
      isLoading={isLoading}
    >
      <MenuBarExtra.Item
        title="Open Full Dashboard"
        icon={Icon.AppWindowList}
        shortcut={Keyboard.Shortcut.Common.Open}
        onAction={() => launchCommand({ name: "dashboard", type: LaunchType.UserInitiated })}
      />
      <MenuBarExtra.Separator />

      {data?.cpu ? <MenuBarExtra.Item title="CPU" subtitle={`${data.cpu.percent}% used`} icon={Icon.Gauge} /> : null}
      {data?.memory ? (
        <MenuBarExtra.Item
          title="Memory"
          subtitle={`${data.memory.percent}% · ${formatBytes(data.memory.usedBytes)} / ${formatBytes(data.memory.totalBytes)}`}
          icon={Icon.MemoryChip}
        />
      ) : null}
      {data?.disk ? (
        <MenuBarExtra.Item
          title="Disk"
          subtitle={`${data.disk.percent}% · ${formatBytes(data.disk.availableBytes)} available`}
          icon={Icon.HardDrive}
        />
      ) : null}
      {data?.network ? (
        <MenuBarExtra.Item
          title={`Network · ${data.network.interfaceName}`}
          subtitle={
            data.network.ready
              ? `↓ ${formatRate(data.network.downloadBytesPerSecond, preferences.networkUnits)}  ↑ ${formatRate(data.network.uploadBytesPerSecond, preferences.networkUnits)}`
              : "Sampling…"
          }
          icon={Icon.Network}
        />
      ) : null}
      {data?.battery ? (
        <MenuBarExtra.Item
          title="Battery"
          subtitle={`${data.battery.percent}% · ${data.battery.state}${data.battery.timeRemaining ? ` · ${data.battery.timeRemaining}` : ""}`}
          icon={data.battery.state === "charging" ? Icon.Bolt : Icon.Battery}
        />
      ) : null}

      {data?.codex ? <MenuBarExtra.Separator /> : null}
      {data?.codex?.limits.flatMap((limit) => [
        ...(limit.primary
          ? [
              <MenuBarExtra.Item
                key={`${limit.id}-primary`}
                title={`${limit.name} · ${formatWindowName(limit.primary.windowDurationMins)}`}
                subtitle={`${remainingPercent(limit.primary)}% remaining · ${formatResetTime(limit.primary.resetsAt)}`}
                icon={Icon.Stars}
              />,
            ]
          : []),
        ...(limit.secondary
          ? [
              <MenuBarExtra.Item
                key={`${limit.id}-secondary`}
                title={`${limit.name} · ${formatWindowName(limit.secondary.windowDurationMins)}`}
                subtitle={`${remainingPercent(limit.secondary)}% remaining · ${formatResetTime(limit.secondary.resetsAt)}`}
                icon={Icon.Stars}
              />,
            ]
          : []),
      ])}

      {data && Object.entries(data.errors).length > 0 ? (
        <MenuBarExtra.Section title="Unavailable">
          {Object.entries(data.errors).map(([module, message]) => (
            <MenuBarExtra.Item
              key={module}
              title={module}
              subtitle={message}
              icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
            />
          ))}
        </MenuBarExtra.Section>
      ) : null}

      <MenuBarExtra.Separator />
      <MenuBarExtra.Item title="Refresh Now" icon={Icon.ArrowClockwise} onAction={revalidate} />
      <MenuBarExtra.Item title="Extension Settings…" icon={Icon.Gear} onAction={openExtensionPreferences} />
    </MenuBarExtra>
  );
}
