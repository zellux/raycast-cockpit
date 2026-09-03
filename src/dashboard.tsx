import {
  Action,
  ActionPanel,
  Color,
  Icon,
  Keyboard,
  List,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import type { ReactNode } from "react";
import {
  formatBytes,
  formatRate,
  formatResetTime,
  formatWindowName,
  progressGlyph,
  remainingPercent,
} from "./lib/format";
import type { ModuleKey, RateLimitWindow, StatusSnapshot } from "./lib/types";
import { useStatusSnapshot } from "./lib/use-status";

function colorForPercent(percent: number, inverted = false): Color {
  const danger = inverted ? percent <= 15 : percent >= 90;
  const warning = inverted ? percent <= 30 : percent >= 75;
  return danger ? Color.Red : warning ? Color.Yellow : Color.Green;
}

function RefreshActions({ refresh }: { refresh: (forceCodex?: boolean) => Promise<void> }) {
  return (
    <ActionPanel>
      <Action
        title="Refresh Now"
        icon={Icon.ArrowClockwise}
        shortcut={Keyboard.Shortcut.Common.Refresh}
        onAction={async () => {
          await showToast({ style: Toast.Style.Animated, title: "Refreshing status…" });
          await refresh(true);
          await showToast({ style: Toast.Style.Success, title: "Status refreshed" });
        }}
      />
      <Action title="Open Extension Settings" icon={Icon.Gear} onAction={openExtensionPreferences} />
    </ActionPanel>
  );
}

function ErrorRow({ module, message, actions }: { module: ModuleKey; message: string; actions: ReactNode }) {
  const title = module === "codex" ? "Codex / GPT" : module[0].toUpperCase() + module.slice(1);
  return (
    <List.Item
      icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
      title={`${title} unavailable`}
      subtitle={message}
      actions={actions}
    />
  );
}

function WindowRow({
  provider,
  window,
  kind,
  actions,
}: {
  provider: string;
  window: RateLimitWindow;
  kind: string;
  actions: ReactNode;
}) {
  const remaining = remainingPercent(window);
  return (
    <List.Item
      icon={{ source: Icon.Stars, tintColor: colorForPercent(remaining, true) }}
      title={`${provider} · ${formatWindowName(window.windowDurationMins)}`}
      subtitle={`${progressGlyph(remaining)}  ${remaining}% remaining`}
      accessories={[{ text: formatResetTime(window.resetsAt), tooltip: `${kind} reset` }]}
      actions={actions}
    />
  );
}

function enabledCount(snapshot: StatusSnapshot): number {
  return [snapshot.cpu, snapshot.memory, snapshot.disk, snapshot.network, snapshot.battery, snapshot.codex].filter(
    Boolean,
  ).length;
}

export default function Dashboard() {
  const { snapshot, isLoading, refresh, preferences } = useStatusSnapshot();
  const actions = <RefreshActions refresh={refresh} />;

  return (
    <List
      isLoading={isLoading}
      navigationTitle="Status Dashboard"
      searchBarPlaceholder="Filter status modules…"
      throttle
    >
      {snapshot ? (
        <List.Section
          title="Overview"
          subtitle={`${enabledCount(snapshot)} modules · updated ${new Date(snapshot.updatedAt).toLocaleTimeString()}`}
        >
          <List.Item
            icon={{ source: Icon.Gauge, tintColor: Color.Blue }}
            title="Mac Status"
            subtitle={
              Object.keys(snapshot.errors).length === 0
                ? "All enabled modules are responding"
                : "Some modules need attention"
            }
            accessories={[
              {
                tag: {
                  value: Object.keys(snapshot.errors).length === 0 ? "Live" : "Partial",
                  color: Object.keys(snapshot.errors).length === 0 ? Color.Green : Color.Yellow,
                },
              },
            ]}
            actions={actions}
          />
        </List.Section>
      ) : null}

      {snapshot && (snapshot.cpu || snapshot.memory || snapshot.disk) ? (
        <List.Section title="System">
          {snapshot.cpu ? (
            <List.Item
              icon={{ source: Icon.Gauge, tintColor: colorForPercent(snapshot.cpu.percent) }}
              title="CPU"
              subtitle={`${progressGlyph(snapshot.cpu.percent)}  ${snapshot.cpu.percent}% used`}
              accessories={[{ tag: `${snapshot.cpu.percent}%` }]}
              actions={actions}
            />
          ) : null}
          {snapshot.memory ? (
            <List.Item
              icon={{ source: Icon.MemoryChip, tintColor: colorForPercent(snapshot.memory.percent) }}
              title="Memory"
              subtitle={`${formatBytes(snapshot.memory.usedBytes)} of ${formatBytes(snapshot.memory.totalBytes)} used`}
              accessories={[{ tag: `${snapshot.memory.percent}%` }]}
              actions={actions}
            />
          ) : null}
          {snapshot.disk ? (
            <List.Item
              icon={{ source: Icon.HardDrive, tintColor: colorForPercent(snapshot.disk.percent) }}
              title="Disk"
              subtitle={`${formatBytes(snapshot.disk.usedBytes)} used · ${formatBytes(snapshot.disk.availableBytes)} available`}
              accessories={[{ tag: `${snapshot.disk.percent}%` }]}
              actions={actions}
            />
          ) : null}
        </List.Section>
      ) : null}

      {snapshot?.network ? (
        <List.Section title="Network" subtitle={snapshot.network.interfaceName}>
          <List.Item
            icon={{ source: Icon.ArrowDown, tintColor: Color.Blue }}
            title="Download"
            subtitle={
              snapshot.network.ready
                ? formatRate(snapshot.network.downloadBytesPerSecond, preferences.networkUnits)
                : "Sampling…"
            }
            actions={actions}
          />
          <List.Item
            icon={{ source: Icon.ArrowUp, tintColor: Color.Purple }}
            title="Upload"
            subtitle={
              snapshot.network.ready
                ? formatRate(snapshot.network.uploadBytesPerSecond, preferences.networkUnits)
                : "Sampling…"
            }
            actions={actions}
          />
        </List.Section>
      ) : null}

      {snapshot?.battery ? (
        <List.Section title="Power">
          <List.Item
            icon={{
              source: snapshot.battery.state === "charging" ? Icon.Bolt : Icon.Battery,
              tintColor: colorForPercent(snapshot.battery.percent, true),
            }}
            title="Battery"
            subtitle={`${snapshot.battery.state}${snapshot.battery.timeRemaining ? ` · ${snapshot.battery.timeRemaining} remaining` : ""}`}
            accessories={[{ tag: `${snapshot.battery.percent}%` }]}
            actions={actions}
          />
        </List.Section>
      ) : null}

      {snapshot?.codex ? (
        <List.Section title="Codex / GPT" subtitle={snapshot.codex.limits[0]?.planType || undefined}>
          {snapshot.codex.limits.flatMap((limit) => [
            ...(limit.primary
              ? [
                  <WindowRow
                    key={`${limit.id}-primary`}
                    provider={limit.name}
                    window={limit.primary}
                    kind="Primary"
                    actions={actions}
                  />,
                ]
              : []),
            ...(limit.secondary
              ? [
                  <WindowRow
                    key={`${limit.id}-secondary`}
                    provider={limit.name}
                    window={limit.secondary}
                    kind="Secondary"
                    actions={actions}
                  />,
                ]
              : []),
          ])}
        </List.Section>
      ) : null}

      {snapshot && Object.entries(snapshot.errors).length > 0 ? (
        <List.Section title="Unavailable Modules">
          {Object.entries(snapshot.errors).map(([module, message]) => (
            <ErrorRow
              key={module}
              module={module as ModuleKey}
              message={message || "Unknown error"}
              actions={actions}
            />
          ))}
        </List.Section>
      ) : null}
    </List>
  );
}
