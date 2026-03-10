# OpenDeck

**OpenDeck** is an open-source alternative to the **Stream Deck**.  
Instead of dedicated hardware, OpenDeck provides a **web-based control surface** accessible from any device on your local network — iPad, tablet, phone, or any browser.

Built with **Electron**, **React**, **Express**, and **WebSockets**.

---

## How It Works

```
Tablet / Phone / Browser
       │
       │  HTTP + WebSocket (port 4020)
       ▼
  Electron Desktop App
       │
       ├── Express server (serves UI + WebSocket)
       ├── Config store (persists settings to disk)
       ├── Module loader (discovers plugins at startup)
       └── Action dispatcher (routes button presses to modules)
       │
       ▼
  Modules (OBS, HTTP webhooks, media keys, etc.)
```

1. **Electron starts** → loads modules from `/modules`, starts an Express + WebSocket server on port `4020`, opens the React UI.
2. **Any device** on the local network opens `http://<your-ip>:4020` in a browser to get the control surface.
3. **Button press** → WebSocket message → action dispatcher → module handler → external system.
4. **Feedback** flows back over WebSocket (success/error glow on the button).
5. **Config sync** — settings edited on the desktop app are persisted to disk and broadcast to all connected clients in real time.

Multiple devices can connect simultaneously. Remote clients are read-only for configuration — only the Electron app can edit settings.

---

## Installation

```bash
git clone https://github.com/opendeck/opendeck
cd opendeck
npm install
```

### Development

```bash
npm run dev
```

This starts three concurrent processes:
- TypeScript compiler in watch mode (Electron backend)
- Vite dev server on port 5173 (React UI with hot reload)
- Electron app (waits for both to be ready, then launches)

### Production Build

```bash
npm run build
npm start
```

---

## Usage

1. Run `npm run dev` (or `npm start` after building)
2. The Electron window opens with the control surface
3. To connect from a tablet/phone, open a browser and go to:

```
http://<desktop-ip>:4020
```

4. Press buttons to trigger actions
5. Click **⚙ Settings** in the header (desktop only) to customize buttons, pages, variables, and display image

Remote clients see a minimal UI — just the "OpenDeck" title and the button grid. No settings access.

---

## Project Structure

```
openDeck/
├── app/
│   ├── electron/                    # Backend (Electron main process)
│   │   ├── main.ts                  # Electron entry — window, server, modules
│   │   ├── server.ts                # Express HTTP + WebSocket server
│   │   ├── module-loader.ts         # Module discovery & registry
│   │   ├── action-dispatcher.ts     # Routes actions to module handlers
│   │   ├── config-store.ts          # Persists config (pages, variables, images) to disk
│   │   └── variable-store.ts        # In-memory variable store for runtime access
│   │
│   ├── renderer/                    # Frontend (React + Vite)
│   │   ├── index.html               # HTML shell
│   │   ├── index.tsx                # React entry
│   │   ├── App.tsx                  # Root — navigation, remote vs local detection
│   │   ├── pages/
│   │   │   ├── ControlPage.tsx      # Stream Deck-style 5×3 grid view
│   │   │   └── SettingsPage.tsx     # Button/page/variable/display image management
│   │   ├── components/
│   │   │   ├── Grid.tsx             # Button grid layout with empty slot support
│   │   │   ├── DeckButton.tsx       # Individual button — icons, images, press feedback
│   │   │   └── ButtonEditor.tsx     # Inline editor for button properties
│   │   ├── hooks/
│   │   │   ├── useSocket.tsx        # WebSocket context with auto-reconnect
│   │   │   └── useDeckConfig.tsx    # Config state, persistence, server sync
│   │   └── styles/
│   │       └── index.css            # Stream Deck-style dark theme
│   │
│   └── shared/                      # Types & protocol shared between backend and frontend
│       ├── types/
│       │   ├── actions.ts           # DeckButton, DeckPage, DeckConfig, DeckVariable
│       │   ├── modules.ts           # ModuleManifest, OpenDeckModule
│       │   ├── messages.ts          # Client/Server message types
│       │   └── index.ts             # Re-exports
│       └── action-protocol/
│           └── index.ts             # Message serialization helpers
│
├── modules/                         # Integration plugins (loaded at startup)
│   ├── obs-control/                 # OBS Studio actions (stub)
│   ├── http-actions/                # HTTP GET/POST requests
│   └── media-controls/              # Windows media key simulation
│
├── package.json
├── tsconfig.json                    # Renderer (ESNext/bundler)
├── tsconfig.electron.json           # Electron backend (CommonJS)
└── vite.config.ts                   # Vite config for React renderer
```

---

## Features

### Button Customization

Each button supports:

| Field       | Description                                              |
|-------------|----------------------------------------------------------|
| `label`     | Text shown on the button                                 |
| `icon`      | Emoji or text icon                                       |
| `iconType`  | `"emoji"` or `"image"` — determines how the icon renders |
| `fillImage` | When `true`, image covers the entire button              |
| `hideLabel` | When `true`, hides the label text                        |
| `action`    | Action ID resolved by the module system                  |
| `payload`   | Optional JSON object passed to the action handler        |

#### Image Icons

Buttons can display uploaded images or image URLs instead of emoji. When using an image:
- **Fill Button** — toggle to make the image cover the full button (with overflow hidden)
- **Hide Label** — toggle to hide the text overlay
- Images up to 50MB are supported (stored as base64)

### Display Image

A background image can be set for the device frame via Settings → Display Image. The image renders behind the button grid with the same rounded styling as the device frame.

### Variables

Variables are key-value pairs defined in Settings. They are synced to the backend and injected into every action payload as `__variables`. Use them for API keys, URLs, or shared configuration across modules.

### Pages

Buttons are organized into pages (tabs). Each page has an independent 5×3 grid. Create, rename, and delete pages from Settings.

### Config Sync

All configuration (pages, buttons, variables, display image) is:
- **Persisted to disk** in Electron's `userData` directory as `opendeck-config.json`
- **Broadcast to all connected clients** via WebSocket when changed
- **Sent to new clients** on connection so remote devices always load the latest config
- **Write-protected on remote clients** — only the Electron desktop app can modify settings

---

## Settings

The Settings page (⚙ button in the header, desktop only) provides:

- **Pages** — add, rename, delete tabbed button groups
- **Buttons** — add, remove, reorder, enable/disable, and edit buttons with the inline editor
- **Button Editor** — set label, icon type (emoji/image), image upload or URL, fill mode, hide label, action ID, and JSON payload
- **Variables** — define key/value pairs available to all modules at runtime
- **Display Image** — upload a background image for the device frame

---

## WebSocket Protocol

Communication between the UI and Electron backend uses JSON messages over WebSocket.

### Client → Server

| Type             | Description                                  |
|------------------|----------------------------------------------|
| `button.press`   | Button was pressed (includes action + payload)|
| `page.change`    | User switched pages                          |
| `device.connect` | Device connected (sends userAgent)           |
| `config.update`  | Full config update (desktop app only)        |

### Server → Client

| Type              | Description                                 |
|-------------------|---------------------------------------------|
| `button.feedback` | Action result — `success` or `error`        |
| `page.update`     | Page change acknowledged                    |
| `state.update`    | State sync                                  |
| `config.sync`     | Full config broadcast (pages, vars, image)  |

Example button press:

```json
{
  "type": "button.press",
  "action": "obs.startStreaming",
  "payload": { "buttonId": "1" }
}
```

Example config sync (server → client):

```json
{
  "type": "config.sync",
  "payload": {
    "pages": [...],
    "variables": [...],
    "displayImage": "data:image/png;base64,..."
  }
}
```

---

## Module Guide

Modules are the integration layer. Each module is a folder inside `/modules` containing a manifest and handler file.

### Module Structure

```
modules/
  my-module/
    manifest.json    # Declares module name and action IDs
    index.js         # Implements the action handlers
```

### Step 1: Create `manifest.json`

```json
{
  "name": "my-module",
  "version": "0.1.0",
  "description": "What this module does",
  "actions": [
    "mymod.doSomething",
    "mymod.doOther"
  ]
}
```

The `actions` array lists every action ID this module handles. Action IDs use dot notation: `moduleName.actionName`.

### Step 2: Create `index.js`

```js
module.exports = {
  actions: {
    "mymod.doSomething": async (payload) => {
      // payload contains button config + __variables from the variable store
      console.log("Doing something!", payload)
    },

    "mymod.doOther": async () => {
      console.log("Doing other thing")
    },
  },
}
```

Each key in `actions` must match an entry in the manifest. The handler receives a `payload` object containing any button-specific payload merged with `__variables` (the variables defined in Settings).

### Step 3: Assign to a Button

In the Settings page, set a button's **Action** field to any action ID from your module (e.g. `mymod.doSomething`). Optionally set a JSON payload.

Modules are loaded once at app startup. Restart the app to pick up new or modified modules.

### Included Modules

| Module           | Actions                                                                  | Status           |
|------------------|--------------------------------------------------------------------------|------------------|
| `media-controls` | `media.playPause`, `media.next`, `media.previous`, `media.volumeUp`, `media.volumeDown`, `media.mute` | Functional (Windows) |
| `http-actions`   | `http.get`, `http.post`                                                  | Functional       |
| `obs-control`    | `obs.startStreaming`, `obs.stopStreaming`, `obs.toggleMute`, `obs.switchScene` | Stub (logging only) |

**media-controls** uses Windows `keybd_event` API via PowerShell to simulate actual media key presses. Works with any app that responds to standard Windows media keys (Spotify, Chrome, VLC, etc.).

**http-actions** sends real HTTP GET/POST requests. Set the `url` (and optional `body` for POST) in the button payload:

```json
{
  "url": "https://example.com/webhook",
  "body": { "event": "button_pressed" }
}
```

**obs-control** logs actions to the console. To make it functional, install `obs-websocket-js` and implement the OBS WebSocket protocol in the handler bodies.

---

## Scripts

| Script              | Description                                     |
|---------------------|-------------------------------------------------|
| `npm run dev`       | Start all dev servers (TypeScript, Vite, Electron) |
| `npm run build`     | Build both Electron backend and React renderer  |
| `npm run build:electron` | Compile TypeScript backend only            |
| `npm run build:renderer` | Build React frontend via Vite only         |
| `npm start`         | Launch the Electron app (requires build first)  |

---

## Tech Stack

| Component  | Technology           | Purpose                           |
|------------|----------------------|-----------------------------------|
| Desktop    | Electron 28          | Window management, native access  |
| Frontend   | React 18 + Vite 5    | Control surface UI                |
| Server     | Express 4            | Serves UI to remote devices       |
| Realtime   | ws (WebSocket)       | Button presses, config sync       |
| Language   | TypeScript 5.3       | Type safety across the stack      |
| Styling    | CSS (custom)         | Stream Deck-inspired dark theme   |

---

## License

MIT License
