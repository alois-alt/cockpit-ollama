#!/bin/bash
# ==============================================================================
# cockpit-ollama — Installation script
# Ce script compile l'application React et l'installe dans Cockpit.
# ==============================================================================
set -euo pipefail
export NODE_OPTIONS="--max-old-space-size=4096"
PLUGIN_NAME="ollama"
COCKPIT_DIR="/usr/share/cockpit/${PLUGIN_NAME}"
SUDOERS_FILE="/etc/sudoers.d/cockpit-ollama"

# Identification de l'utilisateur qui lance le script (pour le sudoers)
if [ -n "${SUDO_USER:-}" ]; then
    CURRENT_USER="$SUDO_USER"
else
    CURRENT_USER=$(whoami)
fi

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC} $*"; }
success(){ echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# 1. Vérification des droits root
[[ $EUID -ne 0 ]] && error "Ce script doit être lancé avec sudo : sudo ./install.sh"

info "Début de l'installation du plugin Cockpit-Ollama..."

# 2. Vérification des dépendances système
info "Vérification des dépendances..."
for cmd in node npm curl systemctl; do
    command -v "$cmd" &>/dev/null || error "Dépendance manquante : $cmd. Installez-la avec : apt install nodejs npm curl"
done

# 3. Préparation du projet (Build)
info "Installation des dépendances npm (cela peut prendre un moment)..."
npm install --silent

info "Compilation du projet React (Build)..."
npm run build || error "Échec de la compilation du projet."

# 4. Installation dans Cockpit
info "Installation des fichiers dans ${COCKPIT_DIR}..."
mkdir -p "${COCKPIT_DIR}"

# Nettoyage de l'ancienne installation
rm -rf "${COCKPIT_DIR:?}"/*

# Copie des fichiers compilés (Bundle JS et CSS)
cp dist/* "${COCKPIT_DIR}/"
[ -f dist/index.css ] && cp dist/index.css "${COCKPIT_DIR}/"

# Copie du manifest et de l'index.html
# On vérifie d'abord si on a une version "stable" à la racine (celle du SCP)
if [ -f "index.html" ] && [ -f "manifest.json" ]; then
    info "Utilisation du HTML et Manifest racine..."
    cp index.html "${COCKPIT_DIR}/"
    cp manifest.json "${COCKPIT_DIR}/"
elif [ -d "pkg/ollama" ]; then
    info "Utilisation de la structure pkg/..."
    cp pkg/ollama/index.html "${COCKPIT_DIR}/"
    cp pkg/ollama/manifest.json "${COCKPIT_DIR}/"
else
    error "Fichiers de configuration (index.html/manifest.json) introuvables."
fi

if [ ! -f "/usr/share/cockpit/ollama/index.css" ] || [ $(stat -c%s "/usr/share/cockpit/ollama/index.css") -lt 1000 ]; then
    echo "Le CSS semble manquant ou corrompu, application du correctif..."
    sudo cp /usr/share/cockpit/ollama/repaire_index_css /usr/share/cockpit/ollama/index.css
fi

# 5. Configuration des droits Sudoers pour les boutons Start/Stop
info "Configuration du fichier sudoers pour l'utilisateur : ${CURRENT_USER}..."
cat <<EOF > "${SUDOERS_FILE}"
# Autorise l'utilisateur Cockpit à piloter le service Ollama sans mot de passe
${CURRENT_USER} ALL=(ALL) NOPASSWD: /usr/bin/systemctl start ollama, /usr/bin/systemctl stop ollama, /usr/bin/systemctl status ollama
EOF

chmod 440 "${SUDOERS_FILE}"

# 6. Permissions finales
info "Réglage des permissions..."
# On donne les droits de lecture à tout le monde
find "${COCKPIT_DIR}" -type f -exec chmod 644 {} +
# On donne les droits d'accès (x) aux dossiers pour qu'ils soient traversables
find "${COCKPIT_DIR}" -type d -exec chmod 755 {} +

# On s'assure que le dossier parent appartient bien à root
chown -R root:root "${COCKPIT_DIR}"
# 7. Redémarrage de Cockpit pour appliquer les changements
info "Redémarrage de Cockpit..."
systemctl try-restart cockpit.socket || true

echo -e "\n${GREEN}====================================================${NC}"
success "Installation terminée avec succès !"
echo -e "${GREEN}====================================================${NC}"
echo -e "Vous pouvez maintenant accéder au plugin dans Cockpit."
echo -e "Si le menu n'apparaît pas, déconnectez-vous et reconnectez-vous.\n"

# 8. Rappel Ollama
if ! systemctl is-active --quiet ollama 2>/dev/null; then
    warn "Note : Le service 'ollama' n'est pas encore actif."
    warn "Lancez : sudo systemctl enable --now ollama"
fi

