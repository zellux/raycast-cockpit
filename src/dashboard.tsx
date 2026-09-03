import {
  Action,
  ActionPanel,
  Color,
  Grid,
  Icon,
  Keyboard,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import type { ReactNode } from "react";
import { formatBytes, formatRate, formatResetTime, formatWindowName, remainingPercent } from "./lib/format";
import type { ModuleKey, RateLimitWindow } from "./lib/types";
import { useStatusSnapshot } from "./lib/use-status";

function colorForPercent(percent: number, inverted = false): Color {
  const danger = inverted ? percent <= 15 : percent >= 90;
  const warning = inverted ? percent <= 30 : percent >= 75;
  return danger ? Color.Red : warning ? Color.Yellow : Color.Green;
}

function shortProviderName(provider: string): string {
  return provider.replace(/^GPT-[^-]+-Codex-/i, "");
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

function MetricTile({
  icon,
  color,
  title,
  value,
  detail,
  keywords,
  actions,
}: {
  icon: Icon;
  color: Color;
  title: string;
  value: string;
  detail?: string;
  keywords?: string[];
  actions: ReactNode;
}) {
  return (
    <Grid.Item
      content={{ source: icon, tintColor: color }}
      title={title}
      subtitle={detail ? `${value} · ${detail}` : value}
      keywords={keywords}
      actions={actions}
    />
  );
}

function CodexTile({
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
  const windowName = formatWindowName(window.windowDurationMins).replace(/ window$/i, "");

  return (
    <MetricTile
      icon={Icon.Stars}
      color={colorForPercent(remaining, true)}
      title={`${shortProviderName(provider)} · ${windowName}`}
      value={`${remaining}% remaining`}
      detail={formatResetTime(window.resetsAt)}
      keywords={["codex", "gpt", provider, kind, windowName]}
      actions={actions}
    />
  );
}

const moduleTitles: Record<ModuleKey, string> = {
  cpu: "CPU",
  memory: "Memory",
  disk: "Disk",
  network: "Network",
  battery: "Battery",
  codex: "Codex / GPT",
};

export default function Dashboard() {
  const { snapshot, isLoading, refresh, preferences } = useStatusSnapshot();
  const actions = <RefreshActions refresh={refresh} />;
  const columns = Math.min(8, Math.max(3, Number(preferences.gridColumns) || 5));
  const visibleMetrics = snapshot
    ? [snapshot.cpu, snapshot.memory, snapshot.disk, snapshot.network, snapshot.battery, snapshot.codex].filter(Boolean)
        .length
    : 0;
  const updatedAt = snapshot
    ? new Date(snapshot.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <Grid
      isLoading={isLoading}
      navigationTitle={updatedAt ? `Status Dashboard · ${updatedAt}` : "Status Dashboard"}
      searchBarPlaceholder="Filter metrics…"
      columns={columns}
      aspectRatio="1"
      fit={Grid.Fit.Contain}
      inset={Grid.Inset.Large}
      throttle
    >
      {snapshot?.cpu ? (
        <MetricTile
          icon={Icon.Gauge}
          color={colorForPercent(snapshot.cpu.percent)}
          title="CPU"
          value={`${snapshot.cpu.percent}% used`}
          keywords={["processor", "system"]}
          actions={actions}
        />
      ) : null}

      {snapshot?.memory ? (
        <MetricTile
          icon={Icon.MemoryChip}
          color={colorForPercent(snapshot.memory.percent)}
          title="Memory"
          value={`${snapshot.memory.percent}% used`}
          detail={`${formatBytes(snapshot.memory.usedBytes)} / ${formatBytes(snapshot.memory.totalBytes)}`}
          keywords={["ram", "system"]}
          actions={actions}
        />
      ) : null}

      {snapshot?.disk ? (
        <MetricTile
          icon={Icon.HardDrive}
          color={colorForPercent(snapshot.disk.percent)}
          title="Disk"
          value={`${snapshot.disk.percent}% used`}
          detail={`${formatBytes(snapshot.disk.availableBytes)} free`}
          keywords={["storage", "drive", "system"]}
          actions={actions}
        />
      ) : null}

      {snapshot?.battery ? (
        <MetricTile
          icon={snapshot.battery.state === "charging" ? Icon.Bolt : Icon.Battery}
          color={colorForPercent(snapshot.battery.percent, true)}
          title="Battery"
          value={`${snapshot.battery.percent}%`}
          detail={`${snapshot.battery.state}${snapshot.battery.timeRemaining ? ` · ${snapshot.battery.timeRemaining} left` : ""}`}
          keywords={["power", "charging"]}
          actions={actions}
        />
      ) : null}

      {snapshot?.network ? (
        <MetricTile
          icon={Icon.ArrowDown}
          color={Color.Blue}
          title="Download"
          value={
            snapshot.network.ready
              ? formatRate(snapshot.network.downloadBytesPerSecond, preferences.networkUnits)
              : "Sampling…"
          }
          detail={snapshot.network.interfaceName}
          keywords={["network", "internet", "receive"]}
          actions={actions}
        />
      ) : null}

      {snapshot?.network ? (
        <MetricTile
          icon={Icon.ArrowUp}
          color={Color.Purple}
          title="Upload"
          value={
            snapshot.network.ready
              ? formatRate(snapshot.network.uploadBytesPerSecond, preferences.networkUnits)
              : "Sampling…"
          }
          detail={snapshot.network.interfaceName}
          keywords={["network", "internet", "send"]}
          actions={actions}
        />
      ) : null}

      {snapshot?.codex
        ? snapshot.codex.limits.flatMap((limit) => [
            ...(limit.primary
              ? [
                  <CodexTile
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
                  <CodexTile
                    key={`${limit.id}-secondary`}
                    provider={limit.name}
                    window={limit.secondary}
                    kind="Secondary"
                    actions={actions}
                  />,
                ]
              : []),
          ])
        : null}

      {snapshot
        ? Object.entries(snapshot.errors).map(([module, message]) => (
            <MetricTile
              key={module}
              icon={Icon.ExclamationMark}
              color={Color.Red}
              title={moduleTitles[module as ModuleKey]}
              value="Unavailable"
              detail={message || "Unknown error"}
              keywords={["error", "unavailable"]}
              actions={actions}
            />
          ))
        : null}

      {snapshot && visibleMetrics === 0 && Object.keys(snapshot.errors).length === 0 ? (
        <Grid.EmptyView
          icon={Icon.Gauge}
          title="No Metrics Enabled"
          description="Choose the metrics and grid width in extension settings."
          actions={actions}
        />
      ) : null}
    </Grid>
  );
}
