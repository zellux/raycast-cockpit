import { Action, ActionPanel, Grid, Icon, Keyboard, openExtensionPreferences, showToast, Toast } from "@raycast/api";
import {
  accents,
  networkRateTile,
  networkStatsTile,
  quotaTile,
  systemTile,
  type NetworkMetricCard,
  type QuotaMetricCard,
  type RingMetricCard,
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
      label: "CPU",
      percent: snapshot.cpu.percent,
      value: `${snapshot.cpu.percent}%`,
      detail: "CPU",
      accent: usageAccent(snapshot.cpu.percent),
    });
  }
  if (snapshot?.memory) {
    systemCards.push({
      label: "Memory",
      percent: snapshot.memory.percent,
      value: `${snapshot.memory.percent}%`,
      detail: formatBytePair(snapshot.memory.usedBytes, snapshot.memory.totalBytes),
      accent: usageAccent(snapshot.memory.percent),
    });
  }
  if (snapshot?.disk) {
    systemCards.push({
      label: "Disk",
      percent: snapshot.disk.percent,
      value: `${snapshot.disk.percent}%`,
      detail: `${formatBytes(snapshot.disk.availableBytes)} free`,
      accent: usageAccent(snapshot.disk.percent),
    });
  }
  if (snapshot?.battery) {
    systemCards.push({
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
          history: networkHistory.download,
          peak: formatRate(Math.max(...networkHistory.download, 0), preferences.networkUnits),
          total: formatBytes(snapshot.network.totalReceivedBytes),
          accent: accents.blue,
        },
        {
          direction: "up",
          value: snapshot.network.ready
            ? formatRate(snapshot.network.uploadBytesPerSecond, preferences.networkUnits)
            : "Sampling…",
          history: networkHistory.upload,
          peak: formatRate(Math.max(...networkHistory.upload, 0), preferences.networkUnits),
          total: formatBytes(snapshot.network.totalSentBytes),
          accent: accents.purple,
        },
      ]
    : [];

  const quotaCards: QuotaMetricCard[] = snapshot?.codex
    ? snapshot.codex.limits.flatMap((limit) =>
        [limit.primary, limit.secondary]
          .filter((window) => window != null)
          .map((window) => {
            const remaining = remainingPercent(window);
            const windowName = formatWindowName(window.windowDurationMins).replace(/ window$/i, "");
            return {
              label: `${shortProviderName(limit.name)} · ${windowName}`,
              percent: remaining,
              reset: `Resets in ${formatResetTime(window.resetsAt).split(" · ")[0]}`,
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
  return (
    <Grid
      isLoading={isLoading}
      navigationTitle={updatedAt ? `Status Dashboard · ${updatedAt}` : "Status Dashboard"}
      searchBarPlaceholder="Filter metrics…"
      columns={4}
      aspectRatio="16/9"
      fit={Grid.Fit.Fill}
      inset={Grid.Inset.Zero}
      throttle
    >
      {systemCards.length > 0 ? (
        <Grid.Section columns={4} aspectRatio="16/9" inset={Grid.Inset.Zero}>
          {systemCards.map((card, index) => (
            <Grid.Item
              key={card.label}
              content={systemTile(card, index === 0 ? `System · ${systemCards.length} metrics` : undefined)}
              keywords={["system", card.label, card.value, card.detail]}
              actions={actions}
            />
          ))}
        </Grid.Section>
      ) : null}

      {networkCards.length > 0 ? (
        <Grid.Section columns={4} aspectRatio="16/9" inset={Grid.Inset.Zero}>
          {networkCards.flatMap((card, index) => {
            const direction = card.direction === "down" ? "download" : "upload";
            return [
              <Grid.Item
                key={`${direction}-rate`}
                content={networkRateTile(card, index === 0 ? `Network · ${networkSubtitle}` : undefined)}
                keywords={["network", direction, "rate", card.value]}
                actions={actions}
              />,
              <Grid.Item
                key={`${direction}-stats`}
                content={networkStatsTile(card)}
                keywords={["network", direction, "peak", "total", card.peak, card.total]}
                actions={actions}
              />,
            ];
          })}
        </Grid.Section>
      ) : null}

      {quotaCards.length > 0 ? (
        <Grid.Section columns={4} aspectRatio="16/9" inset={Grid.Inset.Zero}>
          {quotaCards.map((card, index) => (
            <Grid.Item
              key={card.label}
              content={quotaTile(card, index === 0 ? `Token quota · ${quotaCards.length} windows` : undefined)}
              keywords={["codex", "gpt", "token", "quota", card.label, `${card.percent}%`, card.reset]}
              actions={actions}
            />
          ))}
        </Grid.Section>
      ) : null}

      {snapshot && !hasMetrics ? (
        <Grid.EmptyView
          icon={Icon.Gauge}
          title="No Metrics Available"
          description={
            Object.values(snapshot.errors).filter(Boolean).join(" · ") ||
            "Choose the metrics to display in extension settings."
          }
          actions={actions}
        />
      ) : null}
    </Grid>
  );
}
