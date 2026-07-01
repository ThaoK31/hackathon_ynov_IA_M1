# TechCorp AI — Interface de chat (DEV WEB)

Interface web pour discuter avec l'assistant financier **Phi-3.5-Financial** de TechCorp,
servi par le serveur d'inférence **Ollama** de la filière INFRA.

Streaming des réponses en temps réel, multi-conversations, réglages du modèle, thème
clair / sombre. Interface React + Vite.

## Lancement (une commande)

Prérequis : **Node.js 18+**.

```powershell
# Windows / PowerShell
./start.ps1
```

```bash
# Linux / macOS
./run.sh
```

→ l'interface s'ouvre sur **http://localhost:5173**.

Pour cibler le serveur d'inférence d'une autre machine (celle de l'INFRA) :

```powershell
$env:OLLAMA_URL = "http://<IP-INFRA>:11434" ; ./start.ps1
```

## Déploiement (Docker, une commande)

Pour un déploiement type production (nginx sert le build et proxifie `/api`) :

```bash
OLLAMA_URL=http://<IP-INFRA>:11434 docker compose up -d --build
```

→ interface sur **http://localhost:8080**. Sans variable, le proxy cible `host.docker.internal:11434`
(l'Ollama de la machine hôte).

## Raccourcis clavier

- **Entrée** : envoyer · **Maj+Entrée** : nouvelle ligne
- **↑** (champ vide) : rappeler le dernier message envoyé
- **Ctrl / Cmd + K** : nouvelle conversation

## Connexion au serveur d'inférence

Le navigateur **n'appelle jamais Ollama directement**. Il fait des requêtes same-origin
`/api/*` que Vite relaie vers `OLLAMA_URL` (proxy configuré dans `vite.config.js`).
Résultat : aucun problème de CORS, et l'adresse du serveur reste côté serveur.

L'URL par défaut est `http://localhost:11434` ; elle se règle via `.env` (voir `.env.example`).

## Fonctionnalités

- **Streaming** token par token (endpoint Ollama `/api/chat`), avec bouton **Stop**.
- **État de connexion** au serveur (connecté / déconnecté) avec latence, rafraîchi en continu.
- **Multi-conversations** : création, sélection, suppression, titres automatiques, historique
  persistant dans le navigateur (localStorage).
- **Réglages** : modèle (liste auto des modèles disponibles), température, longueur max,
  prompt système.
- **Rendu Markdown** des réponses (gras, listes, code), échappé pour éviter toute injection.
- **Thème** clair / sombre, interface responsive.

## Structure

```
rendu/devweb/
├─ src/
│  ├─ App.jsx              état global + logique d'envoi / streaming
│  ├─ components/          Sidebar, Composer, Message, TypingIndicator, SettingsPanel…
│  └─ lib/                 ollama.js (client), markdown.js (rendu sûr), storage.js
├─ vite.config.js          proxy /api → Ollama
├─ start.ps1 / run.sh      lancement en une commande
└─ .env.example            configuration de l'URL d'inférence
```
