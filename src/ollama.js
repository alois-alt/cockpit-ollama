const cockpit = window.cockpit; 
const OLLAMA_URL = "http://127.0.0.1:11434";

//const OLLAMA_URL = "http://127.0.0.1:11434";

/**
 * Helper pour exécuter des requêtes via CURL (contourne le CSP du navigateur)
 */
async function ollamaExec(path, method = "GET", body = null) {
    const args = ["curl", "-s", "-X", method, `${OLLAMA_URL}${path}`];
    
    if (body) {
        args.push("-H", "Content-Type: application/json");
        args.push("-d", JSON.stringify(body));
    }

    try {
        const data = await window.cockpit.spawn(args);
        return data ? JSON.parse(data) : {};
    } catch (err) {
        // Si curl échoue (Ollama éteint), on rejette l'erreur
        throw err;
    }
}

// --- STATUT ET LISTES ---

export async function checkServer() {
    try {
        // On récupère la liste des modèles pour compter
        const data = await ollamaExec("/api/tags");
        return {
            running: true,
            modelCount: data.models ? data.models.length : 0
        };
    } catch (err) {
        return {
            running: false,
            modelCount: 0
        };
    }
}

export async function listModels() {
    try {
        const data = await ollamaExec("/api/tags");
        return data.models || [];
    } catch {
        return [];
    }
}

export async function listRunning() {
    try {
        const data = await ollamaExec("/api/ps");
        return data.models || [];
    } catch {
        return [];
    }
}

// --- ACTIONS SUR LES MODÈLES ---

export async function showModel(name) {
    return await ollamaExec("/api/show", "POST", { name });
}

export async function deleteModel(name) {
    return await ollamaExec("/api/delete", "DELETE", { name });
}

// --- GESTION DU SERVICE SYSTÈME ---

export async function getServiceStatus() {
    try {
        const data = await window.cockpit.spawn(["systemctl", "is-active", "ollama"]);
        return data.trim();
    } catch (err) {
        return "inactive";
    }
}

export async function getOllamaVersion() {
    try {
        const data = await window.cockpit.spawn(["ollama", "--version"]);
        return data.trim();
    } catch (err) {
        return "Inconnu";
    }
}

export async function startService() {
    return window.cockpit.spawn(["sudo", "systemctl", "start", "ollama"]);
}

export async function stopService() {
    return window.cockpit.spawn(["sudo", "systemctl", "stop", "ollama"]);
}

// Alias pour ServerStatus.jsx
//export const checkStatus = checkServer;

// --- LE CAS PARTICULIER : PULL ---
// Le pull est complexe car il stream de l'info. On garde une version simplifiée.
export async function pullModel(name, onProgress) {
    // Pour le pull, on lance la commande ollama directement en ligne de commande
    // c'est plus robuste que curl pour le streaming dans Cockpit
    const proc = window.cockpit.spawn(["ollama", "pull", name]);
    
    proc.stream((data) => {
        if (onProgress) {
            // Simulation de progrès basée sur la réception de données
            onProgress({ status: `Téléchargement de ${name}...`, message: data });
        }
    });

    return proc;
}

export const checkStatus = checkServer;
