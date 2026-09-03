import { Icon } from "@raycast/api";

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

export function usageAccent(percent: number, inverted = false): string {
  const danger = inverted ? percent <= 15 : percent >= 90;
  const warning = inverted ? percent <= 75 : percent >= 50;
  return danger ? accents.red : warning ? accents.orange : accents.green;
}

export function systemMetricIcon(icon: SystemMetricIcon): Icon {
  switch (icon) {
    case "cpu":
      return Icon.Monitor;
    case "memory":
      return Icon.MemoryChip;
    case "disk":
      return Icon.HardDrive;
    case "battery":
      return Icon.Battery;
  }
}
