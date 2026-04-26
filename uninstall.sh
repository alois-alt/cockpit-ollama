#!/bin/bash
set -euo pipefail
[[ $EUID -ne 0 ]] && echo "Run as root" && exit 1

rm -rf /usr/share/cockpit/ollama
systemctl try-restart cockpit.socket cockpit 2>/dev/null || true
echo "cockpit-ollama uninstalled."
