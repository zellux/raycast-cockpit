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
        secondary: "#737373",
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

export type SystemMetricIcon = "cpu" | "memory" | "disk" | "battery";

export interface RingMetricCard {
  icon: SystemMetricIcon;
  label: string;
  percent: number;
  value: string;
  detail: string;
  accent: string;
}

export interface NetworkMetricCard {
  direction: "down" | "up";
  value: string;
  peak: string;
  total: string;
  accent: string;
}

export interface QuotaMetricCard {
  id: string;
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

function svgFrame(width: number, height: number, content: string): string {
  return dataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" rx="22" fill="${palette.card}"/>
      ${content}
    </svg>
  `);
}

export function usageAccent(percent: number, inverted = false): string {
  const danger = inverted ? percent <= 15 : percent >= 90;
  const warning = inverted ? percent <= 75 : percent >= 50;
  return danger ? accents.red : warning ? accents.orange : accents.green;
}

function systemIcon(icon: SystemMetricIcon, accent: string): string {
  const common = `fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;

  switch (icon) {
    case "cpu":
      return `<g ${common}><rect x="0" y="3" width="54" height="38" rx="5"/><path d="M18 53h18M27 41v12"/></g>`;
    case "memory":
      return `<g ${common}><rect x="6" y="5" width="42" height="42" rx="6"/><path d="M17 17h20v18H17zM0 16h6M0 28h6M0 40h6M48 16h6M48 28h6M48 40h6"/></g>`;
    case "disk":
      return `<g ${common}><rect x="2" y="7" width="50" height="40" rx="8"/><path d="M2 34h50"/><circle cx="40" cy="40" r="2" fill="${accent}" stroke="none"/></g>`;
    case "battery":
      return `<g ${common}><rect x="1" y="10" width="47" height="34" rx="6"/><path d="M52 21v12M10 27h27"/></g>`;
  }
}

export function systemMetricCard(card: RingMetricCard): string {
  return svgFrame(
    360,
    240,
    `
      <g transform="translate(35 93)">${systemIcon(card.icon, card.accent)}</g>
      <text x="112" y="111" fill="${palette.primary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="48" font-weight="700">${escapeXml(card.value)}</text>
      <text x="112" y="153" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="25" font-weight="500">${escapeXml(card.detail)}</text>
    `,
  );
}

export function networkMetricCard(card: NetworkMetricCard): string {
  const arrow = card.direction === "down" ? "↓" : "↑";
  const label = card.direction === "down" ? "DOWNLOAD" : "UPLOAD";

  return svgFrame(
    420,
    280,
    `
      <text x="24" y="99" fill="${card.accent}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="42" font-weight="700">${arrow}</text>
      <text x="69" y="94" fill="${palette.primary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="38" font-weight="700">${escapeXml(card.value)}</text>
      <text x="71" y="126" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="16" font-weight="600" letter-spacing="1.2">${label}</text>
      <line x1="24" y1="153" x2="396" y2="153" stroke="${palette.divider}" stroke-width="2"/>
      <text x="24" y="187" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="16" font-weight="600" letter-spacing="1">PEAK</text>
      <text x="24" y="222" fill="${palette.primary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="24" font-weight="650">${escapeXml(card.peak)}</text>
      <text x="220" y="187" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="16" font-weight="600" letter-spacing="1">TOTAL</text>
      <text x="220" y="222" fill="${palette.primary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="24" font-weight="650">${escapeXml(card.total)}</text>
    `,
  );
}

export function quotaMetricCard(card: QuotaMetricCard): string {
  const normalized = Math.max(0, Math.min(100, card.percent));
  const progressWidth = (normalized / 100) * 372;

  return svgFrame(
    420,
    280,
    `
      <text x="24" y="72" fill="${palette.primary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="27" font-weight="650">${escapeXml(card.label)}</text>
      <text x="396" y="72" text-anchor="end" fill="${palette.primary}"
        font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="28" font-weight="700">${normalized}%</text>
      <rect x="24" y="112" width="372" height="10" rx="5" fill="${palette.track}"/>
      <rect x="24" y="112" width="${progressWidth}" height="10" rx="5" fill="${card.accent}"/>
      <text x="24" y="173" fill="${palette.secondary}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="23" font-weight="500">${escapeXml(card.reset)}</text>
    `,
  );
}
