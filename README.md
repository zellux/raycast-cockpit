# Status Dashboard

A configurable local Raycast extension for viewing essential Mac and Codex status in one place.

## Included modules

- CPU usage
- Memory pressure and usage
- Root disk usage
- Time since the Mac was last started
- Current upload and download speed on the default network interface
- Battery percentage, state, and time remaining
- Codex / GPT rate-limit windows, remaining percentage, and reset time

Every module can be enabled or disabled independently in Raycast's extension settings.

## Surfaces

### Open Status Dashboard

A single-screen native Raycast grid with separate system, network, and Codex quota cards. Each card has a stable grid identity, so live updates replace only the metric card that changed instead of redrawing one dashboard-sized image. Metrics update at the configured interval, and manual refresh updates them immediately.

### Status Dashboard Menu Bar

An optional compact menu bar item. Its primary label can show network speed, CPU, memory, Codex remaining usage, or only the icon. Raycast refreshes it in the background once per minute.

## Install for local development

Requirements:

- macOS
- Raycast
- Node.js 22 or newer
- Codex CLI signed in, if the Codex module is enabled

```bash
npm install
npm run dev
```

Raycast will register the local development extension. Assign a hotkey to **Open Status Dashboard** in Raycast Settings → Extensions if desired. Enable or disable the menu bar command from the same screen.

## Configuration

Open Raycast Settings → Extensions → Status Dashboard. Available settings include:

- Per-module visibility toggles
- Dashboard sampling interval
- Network byte/bit units
- Primary menu bar value
- Codex CLI executable path

## Project structure

```text
src/
  dashboard.tsx       Native Raycast grid dashboard
  menu-bar.tsx        Compact menu bar surface
  lib/
    collectors.ts     Data collection adapters
    format.ts         Display formatting
    types.ts          Shared data model
    use-status.ts     Live dashboard refresh hook
```

To add a module, extend `ModuleKey` and `StatusSnapshot`, add its collector to `collectSnapshot`, add a preference in `package.json`, and render it in either or both commands.

## Notes

- All system information is collected locally.
- Network speed needs two samples before it can calculate a rate, so the first reading displays “Sampling…”.
- Codex usage is cached for one minute to avoid repeatedly starting the Codex app server.
- Individual collectors fail independently; one unavailable module does not prevent the rest of the dashboard from rendering.

## License

MIT
