# Admin Monitor

The Admin Monitor is a lightweight, terminal-styled dashboard for real-time system observation.

## Features
- **Live Event Stream:** Shows users syncing and sending messages.
- **Global Stats:** Total users, active connections (synced in last 60s), and total messages.
- **Terminal Commands:**
  - `help`: Show available commands.
  - `clear`: Clear the terminal log.

## Design Philosophy
- **Black Background:** Minimalist terminal aesthetic.
- **Color Coding:**
  - Blue: Activity (Sync/Send)
  - Orange: System Logs
  - Green: Info/Status
- **Low Resource Usage:** Uses the same stateless polling as the client to minimize server impact.
