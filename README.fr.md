# cockpit-ollama

🇫🇷 Français | 🇬🇧 [English](README.en.md)

Plugin Cockpit pour gérer votre serveur Ollama et vos modèles IA directement depuis l'interface web de Cockpit.

## Aperçu

![Interface principale](images/screen-1.png)

<p align="center">
  <img src="images/screen-2.png" width="45%" />
  <img src="images/screen-3.png" width="45%" /> 
</p>

## Fonctionnalités

- **Statut du serveur** : état de l'API Ollama + du service systemd, avec boutons Start/Stop
- **Liste des modèles** : affichage, recherche, suppression avec confirmation, info détaillée
- **Pull de modèles** : téléchargement avec barre de progression en temps réel et possibilité d'annulation
- **Modèles actifs** : affichage des modèles chargés en mémoire avec timer de déchargement
- **Sécurité** : validation stricte des noms de modèles, aucune injection shell possible

## À qui s'adresse-t-il ?


Ce plugin est destiné aux utilisateurs qui ont déjà installé Cockpit sur un serveur basé sur Debian/RHEL et qui souhaitent gérer Ollama sans passer par l'interface en ligne de commande (CLI).


> Vous recherchez une interface web autonome ne nécessitant pas l'installation de Cockpit ? Découvrez plutôt [Open WebUI](https://github.com/open-webui/open-webui) : il s'exécute sous forme de conteneur Docker et fonctionne très bien pour les homelabs.

## Prérequis

- Cockpit ≥ 275 installé : `sudo apt install cockpit`
- Node.js ≥ 18 : `sudo apt install nodejs npm`
- Ollama installé : `curl -fsSL https://ollama.com/install.sh | sh`

## Installation rapide

```bash
# Cloner/télécharger le projet
git clone https://github.com/Oday-alt/cockpit-ollama.git
cd cockpit-ollama

# Installer (build + déploiement)
sudo bash install.sh
```

Ensuite, ouvrez Cockpit (`https://votre-serveur:9090`) — le menu **Ollama AI** apparaît dans la barre latérale.

## Installation manuelle (pas à pas)

```bash
# 1. Installer les dépendances Node
npm install

# 2. Compiler le bundle
npm run build

# 3. Créer le dossier du plugin
sudo mkdir -p /usr/share/cockpit/ollama

# 4. Copier les fichiers
sudo cp dist/* /usr/share/cockpit/ollama/
sudo cp pkg/ollama/index.html /usr/share/cockpit/ollama/
sudo cp pkg/ollama/manifest.json /usr/share/cockpit/ollama/

# 5. Redémarrer Cockpit
sudo systemctl restart cockpit.socket
```

## Développement (mode hot-reload)

```bash
# Lier le dossier dist à ~/.local/share/cockpit/ollama
npm run devel-install

# Compiler en mode watch
npm run watch

# Dans un autre terminal — ouvrir Cockpit en mode dev
# (Pas besoin de redémarrer Cockpit, rechargez juste la page)
```

## Architecture & Sécurité

### Pourquoi pas de bridge Python ?

Ce plugin utilise l'API `cockpit.http()` et `cockpit.spawn()` — ce sont les APIs officielles et documentées de Cockpit pour communiquer avec le serveur sans écrire de bridge personnalisé. Cela signifie :

- **Pas de code serveur à maintenir** : tout passe par le bridge Cockpit existant
- **Authentification gérée automatiquement** par Cockpit (PAM, sessions)
- **`cockpit.spawn()`** : les arguments sont passés en tableau (pas une chaîne shell), donc **aucun risque d'injection**
- **Validation des entrées** : les noms de modèles sont validés avec une regex stricte avant tout usage

### Flux des données

```
Navigateur (React)
    │
    │  cockpit.http() → requêtes HTTP vers Ollama API (port 11434)
    │  cockpit.spawn() → commandes système (ollama, systemctl, curl)
    │
    ▼
cockpit-bridge (tourne sur le serveur, authentifié via PAM)
    │
    ├──▶ ollama API (127.0.0.1:11434)
    └──▶ systemctl is-active/start/stop ollama
```

## Désinstallation

```bash
sudo bash uninstall.sh
```

## Dépannage (Correction CSS)
Si l'interface s'affiche sans mise en forme sur certains systèmes (comme Fedora), un fichier CSS indépendant est fourni. Exécutez la commande suivante :
`sudo cp /usr/share/cockpit/ollama/repaire_index_css /usr/share/cockpit/ollama/index.css`


## Structure du projet

```
cockpit-ollama/
├── dist/
│   ├── index.css             # Version valide du css
│   ├── index.js              # Version valide du js
│   ├── RedHat*.woff2         # Polices nécessaire pour cockpit 
│   ├── repaire_index_css     # Fichier de reparation pour le css (cf: Dépannage - Correction CSS - )
├── src/
│   ├── index.js              # Point d'entrée React
│   ├── App.jsx               # Composant racine
│   ├── ollama.js             # Couche API (cockpit.http + cockpit.spawn)
│   ├── cockpit-stub.js       # Stub pour le build webpack
│   └── components/
│       ├── ServerStatus.jsx  # Statut + Start/Stop
│       ├── ModelsList.jsx    # Liste, recherche, suppression
│       ├── PullModel.jsx     # Téléchargement avec progression
│       └── RunningModels.jsx # Modèles chargés en mémoire
├── pkg/ollama/
│   ├── manifest.json         # Déclaration du plugin Cockpit
│   └── index.html            # Page HTML (charge cockpit.js + le bundle)
├── dist/                     # Bundle compilé (généré par npm run build)
├── webpack.config.js
├── package.json
├── install.sh
├── uninstall.sh
└── README.md
```

---
## Remerciements (Collaboration)
Ce projet est le fruit d'une collaboration entre un développeur humain et une IA :
* **Claude (Anthropic)** : logique de base, composants React et architecture initiale.
* **Gemini (Google)** : débogage, dépannage CSS et optimisation du déploiement.
