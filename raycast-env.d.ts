/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** CPU - Include current CPU utilization in the dashboard. */
  "showCpu": boolean,
  /** Memory - Include current memory pressure and utilization. */
  "showMemory": boolean,
  /** Disk - Include usage for the selected volume. */
  "showDisk": boolean,
  /** Uptime - Include the time since this Mac was last started. */
  "showUptime": boolean,
  /** Network - Include live upload and download throughput for the selected interface. */
  "showNetwork": boolean,
  /** Battery - Include battery percentage, charging state, and estimated time remaining. */
  "showBattery": boolean,
  /** Codex / GPT - Include remaining Codex usage windows from the signed-in Codex CLI. */
  "showCodex": boolean,
  /** Codex Spark - Include Spark rate-limit windows alongside the other Codex windows. */
  "showSpark": boolean,
  /** Claude - Include remaining Claude five-hour and weekly usage from Claude Desktop. */
  "showClaude": boolean,
  /** Dashboard Refresh - How often live metric cards update. Manual refresh updates them immediately. */
  "dashboardRefreshSeconds": "2" | "5" | "10" | "30",
  /** Network Units - Display network throughput as bytes or bits per second. */
  "networkUnits": "bytes" | "bits",
  /** Disk Volume - Mount point to report disk usage for. Defaults to the startup volume. */
  "diskVolume": string,
  /** Network Interface - Interface to measure, for example en0. Leave empty to follow the current default route. */
  "networkInterface": string,
  /** Codex CLI Path - Codex CLI executable. A bare name is resolved from PATH; use an absolute path to pin a specific install. */
  "codexPath": string,
  /** Claude Usage File - Path to Claude Desktop's local plan usage history file. */
  "claudeUsagePath": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `dashboard` command */
  export type Dashboard = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `dashboard` command */
  export type Dashboard = {}
}

