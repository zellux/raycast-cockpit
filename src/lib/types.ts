export type ModuleKey = "cpu" | "memory" | "disk" | "network" | "battery" | "codex";

export interface CpuMetric {
  percent: number;
}

export interface MemoryMetric {
  percent: number;
  usedBytes: number;
  totalBytes: number;
}

export interface DiskMetric {
  percent: number;
  usedBytes: number;
  totalBytes: number;
  availableBytes: number;
}

export interface NetworkMetric {
  interfaceName: string;
  downloadBytesPerSecond: number;
  uploadBytesPerSecond: number;
  ready: boolean;
}

export interface BatteryMetric {
  percent: number;
  state: "charging" | "charged" | "discharging" | "unknown";
  timeRemaining?: string;
}

export interface RateLimitWindow {
  usedPercent: number;
  windowDurationMins: number | null;
  resetsAt: number | null;
}

export interface CodexLimit {
  id: string;
  name: string;
  planType?: string | null;
  primary?: RateLimitWindow | null;
  secondary?: RateLimitWindow | null;
}

export interface CodexMetric {
  limits: CodexLimit[];
}

export interface StatusSnapshot {
  updatedAt: number;
  cpu?: CpuMetric;
  memory?: MemoryMetric;
  disk?: DiskMetric;
  network?: NetworkMetric;
  battery?: BatteryMetric;
  codex?: CodexMetric;
  errors: Partial<Record<ModuleKey, string>>;
}

export interface ModulePreferences {
  showCpu: boolean;
  showMemory: boolean;
  showDisk: boolean;
  showNetwork: boolean;
  showBattery: boolean;
  showCodex: boolean;
  networkUnits: "bytes" | "bits";
  codexPath: string;
}
