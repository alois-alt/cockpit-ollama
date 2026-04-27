# cockpit-ollama

🇫🇷 [Français](README.fr.md) | 🇬🇧 English

A Cockpit plugin to manage your Ollama AI server and models directly from the Cockpit web interface.

## Preview

![Main interface](images/screen-1.png)

<p align="center">
  <img src="images/screen-2.png" width="45%" />
  <img src="images/screen-3.png" width="45%" />
</p>

## Features

- **Server status** — Ollama API state + systemd service status, with Start/Stop buttons
- **Model list** — browse, search, delete with confirmation, detailed model info
- **Pull models** — download with real-time progress bar and cancel support
- **Active models** — view models currently loaded in memory with an unload countdown timer
- **Security** — strict model name validation, no shell injection possible

## Who is this for?

This plugin is for users who **already have Cockpit installed** on a Debian/RHEL-based server and want to manage Ollama without touching the CLI.

> Looking for a standalone web UI with no Cockpit requirement? Check out [Open WebUI](https://github.com/open-webui/open-webui) instead — it runs as a Docker container and works great for homelabs.

## Requirements

- Debian 11/12/13 (or any derivative: Ubuntu, Raspberry Pi OS…)
- Cockpit ≥ 275: `sudo apt install cockpit`
- Node.js ≥ 18: `sudo apt install nodejs npm`
- Ollama installed: `curl -fsSL https://ollama.com/install.sh | sh`

## Quick Install

```bash
# Clone the repository
git clone https://github.com/Oday-alt/cockpit-ollama.git
cd cockpit-ollama

# Build and install
sudo bash install.sh
```

Then open Cockpit (`https://your-server:9090`) — **Ollama AI** will appear in the left sidebar.

## Manual Install (step by step)

```bash
# 1. Install Node dependencies
npm install

# 2. Build the bundle
npm run build

# 3. Create the plugin directory
sudo mkdir -p /usr/share/cockpit/ollama

# 4. Copy files
sudo cp dist/index.js /usr/share/cockpit/ollama/
sudo cp dist/index.css /usr/share/cockpit/ollama/
sudo cp pkg/ollama/index.html /usr/share/cockpit/ollama/
sudo cp pkg/ollama/manifest.json /usr/share/cockpit/ollama/

# 5. Restart Cockpit
sudo systemctl restart cockpit.socket
```

## Development (hot-reload)

```bash
# Link the dist folder to your local Cockpit extensions
npm run devel-install

# Watch mode — recompiles on every file change
npm run watch

# Just reload the Cockpit page in your browser — no restart needed
```

## Architecture & Security

### Why no Python bridge?

This plugin uses `cockpit.spawn()` — the official, documented Cockpit API for running commands on the server. This means:

- **No server-side code to maintain** — everything goes through the existing cockpit-bridge
- **Authentication handled automatically** by Cockpit (PAM sessions)
- **No shell injection risk** — arguments are always passed as arrays, never as concatenated strings
- **Input validation** — model names are validated against a strict regex before any use

### Data flow

```
Browser (React)
    │
    │  cockpit.spawn(['curl', ...]) → Ollama API (port 11434)
    │  cockpit.spawn(['systemctl', ...]) → service management
    │
    ▼
cockpit-bridge (runs on the server, authenticated via PAM)
    │
    ├──▶ Ollama API (127.0.0.1:11434)
    └──▶ systemctl is-active / start / stop ollama
```

### Permissions

- `systemctl start/stop` is configured via sudoers by the install script (no password prompt)
- Reading the Ollama API requires no elevated privileges

## Uninstall

```bash
sudo bash uninstall.sh
```

## Troubleshooting

**The interface loads without any styling (missing CSS)**

This can happen on some systems (e.g. Fedora). A pre-built CSS fallback is included. Run:

```bash
sudo cp /usr/share/cockpit/ollama/repaire_index_css /usr/share/cockpit/ollama/index.css
```

**The "Ollama AI" menu entry doesn't appear after install**

Log out of Cockpit and log back in. The menu is cached per session.

**Start/Stop buttons don't work**

Make sure the sudoers rule was created correctly by the install script:
```bash
cat /etc/sudoers.d/cockpit-ollama
```

## Project Structure

```
cockpit-ollama/
├── dist/
│   ├── index.js              # Compiled JS bundle
│   ├── index.css             # Compiled CSS bundle
│   ├── RedHat*.woff2         # Red Hat fonts required by Cockpit
│   └── repaire_index_css     # CSS fallback for broken installs
├── src/
│   ├── index.js              # React entry point
│   ├── App.jsx               # Root component
│   ├── ollama.js             # API layer (cockpit.spawn)
│   ├── cockpit-stub.js       # Webpack stub for local builds
│   └── components/
│       ├── ServerStatus.jsx  # Status card + Start/Stop
│       ├── ModelsList.jsx    # List, search, delete
│       ├── PullModel.jsx     # Download with progress
│       └── RunningModels.jsx # Models loaded in memory
├── pkg/ollama/
│   ├── manifest.json         # Cockpit plugin declaration
│   └── index.html            # HTML page (loads cockpit.js + bundle)
├── webpack.config.js
├── package.json
├── install.sh
├── uninstall.sh
└── README.md
```

---

## Credits

This project was built through a human + AI collaboration:

- **Claude (Anthropic)** — initial architecture, React components, security layer
- **Gemini (Google)** — debugging, CSS fixes, deployment optimisation
