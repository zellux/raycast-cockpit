import { environment } from "@raycast/api";

const palette =
  environment.appearance === "dark"
    ? {
        card: "#2C2C2E",
        primary: "#F5F5F7",
        secondary: "#A7A7AC",
        track: "#48484A",
        divider: "#545458",
      }
    : {
        card: "#E9E9E7",
        primary: "#1C1C1E",
        secondary: "#858585",
        track: "#D0D0CE",
        divider: "#C8C8C6",
      };

export const accents = {
  green: "#2FC47A",
  orange: "#FFAA20",
  red: "#FF5A52",
  blue: "#3787FF",
  purple: "#7657E8",
};

export interface RingMetricCard {
  label: string;
  percent: number;
  value: string;
  detail: string;
  accent: string;
}

export interface NetworkMetricCard {
  direction: "down" | "up";
  value: string;
  history: number[];
  peak: string;
  total: string;
  accent: string;
}

export interface QuotaMetricCard {
  label: string;
  percent: number;
  reset: string;
  accent: string;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return replacements[character];
  });
}

function dataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function tileDocument(content: string): string {
  return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180">${content}</svg>`);
}

function groupLabel(label?: string): string {
  return label
    ? `<text x="3" y="18" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="16" font-weight="700">${escapeXml(label)}</text>`
    : "";
}

export function usageAccent(percent: number, inverted = false): string {
  const danger = inverted ? percent <= 15 : percent >= 90;
  const warning = inverted ? percent <= 75 : percent >= 50;
  return danger ? accents.red : warning ? accents.orange : accents.green;
}

function ringCard(card: RingMetricCard, x: number, y: number, width: number): string {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const progress = (Math.max(0, Math.min(100, card.percent)) / 100) * circumference;
  const ringX = x + 58;
  const ringY = y + 62;
  const textX = x + 112;

  return `
    <rect x="${x}" y="${y}" width="${width}" height="124" rx="17" fill="${palette.card}"/>
    <circle cx="${ringX}" cy="${ringY}" r="${radius}" fill="none" stroke="${palette.track}" stroke-width="10"/>
    <circle cx="${ringX}" cy="${ringY}" r="${radius}" fill="none" stroke="${card.accent}" stroke-width="10"
      stroke-linecap="round" stroke-dasharray="${progress} ${circumference}" transform="rotate(-90 ${ringX} ${ringY})"/>
    <text x="${textX}" y="${y + 56}" fill="${palette.primary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="30" font-weight="700">${escapeXml(card.value)}</text>
    <text x="${textX}" y="${y + 88}" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="18" font-weight="500">${escapeXml(card.detail)}</text>
  `;
}

export function systemTile(card: RingMetricCard, group?: string): string {
  return tileDocument(`${groupLabel(group)}${ringCard(card, 0, 28, 360)}`);
}

function sparkline(values: number[], width: number, height: number, startX: number, startY: number): string {
  const samples = values.length > 1 ? values : [0, 0];
  const maximum = Math.max(...samples, 1);
  return samples
    .map((value, index) => {
      const x = startX + (index / (samples.length - 1)) * width;
      const y = startY + height - (value / maximum) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function networkRateTile(card: NetworkMetricCard, group?: string): string {
  const arrow = card.direction === "down" ? "↓" : "↑";
  const label = card.direction === "down" ? "Download" : "Upload";
  const points = sparkline(card.history, 150, 44, 184, 85);

  return tileDocument(`
    ${groupLabel(group)}
    <rect x="0" y="28" width="360" height="124" rx="17" fill="${palette.card}"/>
    <text x="24" y="83" fill="${card.accent}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="29" font-weight="700">${arrow}</text>
    <text x="61" y="81" fill="${palette.primary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="29" font-weight="700">${escapeXml(card.value)}</text>
    <text x="24" y="124" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="18" font-weight="500">${label}</text>
    <polyline points="${points}" fill="none" stroke="${card.accent}" stroke-width="4"
      stroke-linecap="round" stroke-linejoin="round"/>
  `);
}

export function networkStatsTile(card: NetworkMetricCard): string {
  const label = card.direction === "down" ? "Download traffic" : "Upload traffic";
  return tileDocument(`
    <rect x="0" y="28" width="360" height="124" rx="17" fill="${palette.card}"/>
    <text x="24" y="65" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="17" font-weight="600">${label}</text>
    <text x="24" y="103" fill="${palette.primary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="28" font-weight="700">${escapeXml(card.total)}</text>
    <text x="24" y="132" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="17" font-weight="500">Peak ${escapeXml(card.peak)}</text>
  `);
}

function networkMetricCard(card: NetworkMetricCard, x: number, y: number, width: number): string {
  const arrow = card.direction === "down" ? "↓" : "↑";
  const sparklineStart = x + 188;
  const sparklineWidth = Math.max(120, width - 420);
  const dividerX = sparklineStart + sparklineWidth + 22;
  const detailsX = dividerX + 24;
  const points = sparkline(card.history, sparklineWidth, 38, sparklineStart, y + 48);

  return `
    <rect x="${x}" y="${y}" width="${width}" height="108" rx="17" fill="${palette.card}"/>
    <text x="${x + 25}" y="${y + 67}" fill="${card.accent}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="28" font-weight="700">${arrow}</text>
    <text x="${x + 62}" y="${y + 66}" fill="${palette.primary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="29" font-weight="700">${escapeXml(card.value)}</text>
    <polyline points="${points}" fill="none" stroke="${card.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="${dividerX}" y1="${y + 28}" x2="${dividerX}" y2="${y + 82}" stroke="${palette.divider}" stroke-width="2"/>
    <text x="${detailsX}" y="${y + 48}" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="16" font-weight="500">peak ${escapeXml(card.peak)}</text>
    <text x="${detailsX}" y="${y + 76}" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="16" font-weight="500">total ${escapeXml(card.total)}</text>
  `;
}

function quotaMetricCard(card: QuotaMetricCard, x: number, y: number, width: number): string {
  const normalized = Math.max(0, Math.min(100, card.percent));
  const progressWidth = (normalized / 100) * (width - 44);

  return `
    <rect x="${x}" y="${y}" width="${width}" height="126" rx="17" fill="${palette.card}"/>
    <text x="${x + 22}" y="${y + 39}" fill="${palette.primary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="21" font-weight="650">${escapeXml(card.label)}</text>
    <text x="${x + width - 22}" y="${y + 39}" text-anchor="end" fill="${palette.primary}"
      font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="21" font-weight="700">${normalized}%</text>
    <rect x="${x + 22}" y="${y + 61}" width="${width - 44}" height="8" rx="4" fill="${palette.track}"/>
    <rect x="${x + 22}" y="${y + 61}" width="${progressWidth}" height="8" rx="4" fill="${card.accent}"/>
    <text x="${x + 22}" y="${y + 101}" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="17" font-weight="500">${escapeXml(card.reset)}</text>
  `;
}

export function quotaTile(card: QuotaMetricCard, group?: string): string {
  return tileDocument(`${groupLabel(group)}${quotaMetricCard(card, 0, 28, 360)}`);
}

function sectionTitle(title: string, subtitle: string, y: number): string {
  return `
    <text x="16" y="${y}" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
      font-size="19" font-weight="700">${escapeXml(title)}</text>
    <text x="${16 + title.length * 11 + 14}" y="${y}" fill="${palette.secondary}" opacity="0.72"
      font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="17" font-weight="500">${escapeXml(subtitle)}</text>
  `;
}

export function dashboardCard({
  system,
  network,
  networkSubtitle,
  quotas,
}: {
  system: RingMetricCard[];
  network: NetworkMetricCard[];
  networkSubtitle: string;
  quotas: QuotaMetricCard[];
}): string {
  const contentWidth = 1168;
  const startX = 16;
  const gap = 14;
  const systemWidth = (contentWidth - gap * 3) / 4;
  const networkWidth = (contentWidth - gap) / 2;
  const quotaWidth = (contentWidth - gap * 2) / 3;

  const systemCards = system
    .slice(0, 4)
    .map((card, index) => ringCard(card, startX + index * (systemWidth + gap), 50, systemWidth))
    .join("");
  const networkCards = network
    .slice(0, 2)
    .map((card, index) => networkMetricCard(card, startX + index * (networkWidth + gap), 222, networkWidth))
    .join("");
  const quotaCards = quotas
    .slice(0, 3)
    .map((card, index) => quotaMetricCard(card, startX + index * (quotaWidth + gap), 390, quotaWidth))
    .join("");

  return dataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
      ${system.length > 0 ? sectionTitle("System", `${system.length} metrics`, 31) : ""}
      ${systemCards}
      ${network.length > 0 ? sectionTitle("Network", networkSubtitle, 205) : ""}
      ${networkCards}
      ${quotas.length > 0 ? sectionTitle("Token quota", `${quotas.length} windows`, 372) : ""}
      ${quotaCards}
    </svg>
  `);
}
