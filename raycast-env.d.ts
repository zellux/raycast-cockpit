/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** CPU - Include current CPU utilization in the dashboard and menu bar. */
  "showCpu": boolean,
  /** Memory - Include current memory pressure and utilization. */
  "showMemory": boolean,
  /** Disk - Include usage for the macOS root disk. */
  "showDisk": boolean,
  /** Network - Include live upload and download throughput for the default interface. */
  "showNetwork": boolean,
  /** Battery - Include battery percentage, charging state, and estimated time remaining. */
  "showBattery": boolean,
  /** Codex / GPT - Include remaining Codex usage windows from the signed-in Codex CLI. */
  "showCodex": boolean,
  /** Dashboard Sampling - How often metrics are sampled. The dashboard redraws at most every 30 seconds to avoid flicker; manual refresh redraws immediately. */
  "dashboardRefreshSeconds": "2" | "5" | "10" | "30",
  /** Network Units - Display network throughput as bytes or bits per second. */
  "networkUnits": "bytes" | "bits",
  /** Menu Bar Summary - Choose the primary value displayed beside the menu bar icon. */
  "menuBarPrimary": "network" | "cpu" | "memory" | "codex" | "icon",
  /** Codex CLI Path - Absolute path to the Codex CLI executable. */
  "codexPath": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `dashboard` command */
  export type Dashboard = ExtensionPreferences & {}
  /** Preferences accessible in the `menu-bar` command */
  export type MenuBar = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `dashboard` command */
  export type Dashboard = {}
  /** Arguments passed to the `menu-bar` command */
  export type MenuBar = {}
}

