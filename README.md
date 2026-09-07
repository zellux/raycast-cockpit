# Status Dashboard

A configurable local Raycast extension for viewing essential Mac, Codex, and Claude status in one place.

## Included modules

- CPU usage
- Memory pressure and usage
- Root disk usage
- Time since the Mac was last started
- Current upload and download speed on the default network interface
- Battery percentage, state, and time remaining
- Codex / GPT rate-limit windows, remaining percentage, and reset time
- Claude five-hour and weekly remaining usage from Claude Desktop's local history

Every module can be enabled or disabled independently in Raycast's extension settings.

A single-screen native Raycast grid with separate system, network, and Codex quota cards. Each card has a stable grid identity, so live updates replace only the metric card that changed instead of redrawing one dashboard-sized image. Metrics update at the configured interval, and manual refresh updates them immediately.

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

Raycast will register the local development extension. Assign a hotkey to **Open Status Dashboard** in Raycast Settings → Extensions if desired.

## Configuration

Open Raycast Settings → Extensions → Status Dashboard. Available settings include:

- Per-module visibility toggles
- Dashboard sampling interval
- Network byte/bit units
- Codex CLI executable path and optional Spark visibility (hidden by default)
- Claude Desktop usage-history path

## Project structure

```text
src/
  dashboard.tsx       Native Raycast grid dashboard
  lib/
    collectors.ts     Data collection adapters
    format.ts         Display formatting
    types.ts          Shared data model
    use-status.ts     Live dashboard refresh hook
```

To add a module, extend `ModuleKey` and `StatusSnapshot`, add its collector to `collectSnapshot`, add a preference in `package.json`, and render it in the dashboard.

## Notes

- All system information is collected locally.
- Network speed needs two samples before it can calculate a rate, so the first reading displays “Sampling…”.
- Codex usage is cached for one minute to avoid repeatedly starting the Codex app server.
- Claude usage is read locally and shows source freshness because Claude's history file does not include reset timestamps.
- Individual collectors fail independently; one unavailable module does not prevent the rest of the dashboard from rendering.

## License

MIT
