import { Action, ActionPanel, Grid, Icon, Keyboard, openExtensionPreferences, showToast, Toast } from "@raycast/api";
import {
  accents,
  networkMetricCard,
  type NetworkMetricCard,
  quotaMetricCard,
  type QuotaMetricCard,
  type RingMetricCard,
  systemMetricCard,
  usageAccent,
} from "./lib/cards";
import { formatBytes, formatRate, formatResetTime, formatWindowName, remainingPercent } from "./lib/format";
import { useStatusSnapshot } from "./lib/use-status";

function shortProviderName(provider: string): string {
  return provider.replace(/^GPT-[^-]+-Codex-/i, "");
}

function formatBytePair(usedBytes: number, totalBytes: number): string {
  const [usedValue, usedUnit] = formatBytes(usedBytes).split(" ");
  const [totalValue, totalUnit] = formatBytes(totalBytes).split(" ");
  return usedUnit === totalUnit
    ? `${usedValue} / ${totalValue} ${usedUnit}`
    : `${formatBytes(usedBytes)} / ${formatBytes(totalBytes)}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

export default function Dashboard() {
  const { snapshot, networkHistory, isLoading, refresh, preferences } = useStatusSnapshot();
  const actions = <RefreshActions refresh={refresh} />;
  const updatedAt = snapshot
    ? new Date(snapshot.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  const systemCards: RingMetricCard[] = [];
  if (snapshot?.cpu) {
    systemCards.push({
      icon: "cpu",
      label: "CPU",
      percent: snapshot.cpu.percent,
      value: `${snapshot.cpu.percent}%`,
      detail: "CPU",
      accent: usageAccent(snapshot.cpu.percent),
    });
  }
  if (snapshot?.memory) {
    systemCards.push({
      icon: "memory",
      label: "Memory",
      percent: snapshot.memory.percent,
      value: `${snapshot.memory.percent}%`,
      detail: formatBytePair(snapshot.memory.usedBytes, snapshot.memory.totalBytes),
      accent: usageAccent(snapshot.memory.percent),
    });
  }
  if (snapshot?.disk) {
    systemCards.push({
      icon: "disk",
      label: "Disk",
      percent: snapshot.disk.percent,
      value: `${snapshot.disk.percent}%`,
      detail: `${formatBytes(snapshot.disk.availableBytes)} free`,
      accent: usageAccent(snapshot.disk.percent),
    });
  }
  if (snapshot?.battery) {
    systemCards.push({
      icon: "battery",
      label: "Battery",
      percent: snapshot.battery.percent,
      value: `${snapshot.battery.percent}%`,
      detail: capitalize(snapshot.battery.state),
      accent: usageAccent(snapshot.battery.percent, true),
    });
  }

  const networkCards: NetworkMetricCard[] = snapshot?.network
    ? [
        {
          direction: "down",
          value: snapshot.network.ready
            ? formatRate(snapshot.network.downloadBytesPerSecond, preferences.networkUnits)
            : "Sampling…",
          peak: formatRate(Math.max(...networkHistory.download, 0), preferences.networkUnits),
          total: formatBytes(snapshot.network.totalReceivedBytes),
          accent: accents.blue,
        },
        {
          direction: "up",
          value: snapshot.network.ready
            ? formatRate(snapshot.network.uploadBytesPerSecond, preferences.networkUnits)
            : "Sampling…",
          peak: formatRate(Math.max(...networkHistory.upload, 0), preferences.networkUnits),
          total: formatBytes(snapshot.network.totalSentBytes),
          accent: accents.purple,
        },
      ]
    : [];

  const quotaCards: QuotaMetricCard[] = snapshot?.codex
    ? snapshot.codex.limits.flatMap((limit) =>
        [
          { kind: "primary", window: limit.primary },
          { kind: "secondary", window: limit.secondary },
        ]
          .filter((entry) => entry.window != null)
          .map(({ kind, window }) => {
            const remaining = remainingPercent(window!);
            const windowName = formatWindowName(window!.windowDurationMins).replace(/ window$/i, "");
            return {
              id: `${limit.id}-${kind}`,
              label: `${shortProviderName(limit.name)} · ${windowName}`,
              percent: remaining,
              reset: `Resets in ${formatResetTime(window!.resetsAt).split(" · ")[0]}`,
              accent: usageAccent(remaining, true),
            };
          }),
      )
    : [];

  const networkSamples = Math.max(networkHistory.download.length, networkHistory.upload.length);
  const networkSeconds = Math.max(0, (networkSamples - 1) * Math.max(2, Number(preferences.dashboardRefreshSeconds)));
  const networkSubtitle = snapshot?.network
    ? `${snapshot.network.interfaceName}${networkSeconds > 0 ? ` · ${networkSeconds}s` : " · sampling"}`
    : "";
  const hasMetrics = systemCards.length > 0 || networkCards.length > 0 || quotaCards.length > 0;
  const emptyMessage =
    Object.values(snapshot?.errors ?? {})
      .filter(Boolean)
      .join(" · ") || "Choose the metrics to display in extension settings.";

  return (
    <Grid
      isLoading={isLoading}
      navigationTitle={updatedAt ? `Status Dashboard · ${updatedAt}` : "Status Dashboard"}
      searchBarPlaceholder="Filter metrics…"
      columns={3}
      aspectRatio="3/2"
      fit={Grid.Fit.Fill}
      inset={Grid.Inset.Zero}
    >
      {!hasMetrics ? (
        <Grid.EmptyView title="No Metrics Available" description={emptyMessage} icon={Icon.Gauge} />
      ) : null}

      {systemCards.length > 0 ? (
        <Grid.Section title="System" subtitle={`${systemCards.length} metrics`} columns={4} aspectRatio="3/2">
          {systemCards.map((card) => (
            <Grid.Item
              key={card.label}
              id={`system-${card.label.toLowerCase()}`}
              content={{ value: systemMetricCard(card), tooltip: `${card.label}: ${card.value} · ${card.detail}` }}
              keywords={[card.label, card.value, card.detail]}
              actions={actions}
            />
          ))}
        </Grid.Section>
      ) : null}

      {networkCards.length > 0 ? (
        <Grid.Section title="Network" subtitle={networkSubtitle} columns={2} aspectRatio="16/9">
          {networkCards.map((card) => {
            const label = card.direction === "down" ? "Download" : "Upload";
            return (
              <Grid.Item
                key={card.direction}
                id={`network-${card.direction}`}
                content={{ value: networkMetricCard(card), tooltip: `${label}: ${card.value}` }}
                keywords={[label, card.value, card.peak, card.total]}
                actions={actions}
              />
            );
          })}
        </Grid.Section>
      ) : null}

      {quotaCards.length > 0 ? (
        <Grid.Section title="Token quota" subtitle={`${quotaCards.length} windows`} columns={3} aspectRatio="3/2">
          {quotaCards.map((card) => (
            <Grid.Item
              key={card.id}
              id={`quota-${card.id}`}
              content={{ value: quotaMetricCard(card), tooltip: `${card.label}: ${card.percent}% · ${card.reset}` }}
              keywords={[card.label, `${card.percent}%`, card.reset]}
              actions={actions}
            />
          ))}
        </Grid.Section>
      ) : null}
    </Grid>
  );
}
