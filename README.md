<div align="center">

# GitHub Readme Profile Calendar Graph

**An animated, self-hosted GitHub-style contribution calendar card for your profile README.**

[![License: MIT](https://img.shields.io/github/license/MrDeveloperJIS/github-profile-calendar-graph?color=blue)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Deploy on Vercel](https://img.shields.io/badge/deploy-vercel-black?logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/MrDeveloperJIS/github-profile-calendar-graph&env=GH_TOKEN,USERNAMES&envDescription=Required%20environment%20variables%20—%20see%20the%20README%20for%20how%20to%20get%20a%20GH_TOKEN&envLink=https://github.com/MrDeveloperJIS/github-profile-calendar-graph%23-creating-a-github-personal-access-token&project-name=github-profile-calendar-graph&repository-name=github-profile-calendar-graph)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/MrDeveloperJIS/github-profile-calendar-graph/pulls)

Continuously scrolling, pixel-matched to GitHub's own contribution graph, light or dark. Plain JavaScript, deployed as Vercel Serverless Functions — no framework, no build step, no database.

</div>

```md
![contribution calendar](https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME&theme=dark)
```

---

## Table of Contents

- [Features](#-features)
- [Examples](#️-examples)
- [Quick Start](#-quick-start)
- [Creating a GitHub Personal Access Token](#-creating-a-github-personal-access-token)
- [Deployment](#️-deployment)
- [Usage](#-usage)
- [Local development](#️-local-development)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

- 🟩 Matches GitHub's contribution colors (light & dark)
- 🔁 Infinite scroll animation — single animated SVG, no GIF, no client JS
- 🌗 Light/dark theme via `?theme=`
- 🔒 Username allowlist via `USERNAMES`, so your token can't be used to scrape arbitrary accounts
- 📆 Full history by default, or from a custom start year/date via `?year=`/`?date=`
- 🎨 Custom text/background/border colors via `?color=`, `?bg-color=`, `?border=` — the grid squares stay fixed
- 📱 Responsive width, edge-cached data

---

## 🖼️ Examples

```md
`https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=light`
```
![preview](https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=light&year=2020) 

```md
`https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=dark`
```
![preview](https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=dark&year=2020)

```md
`https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=dark&year=2020`
```
![preview](https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=dark&year=2020)

```md
`https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=dark&date=20092024`
```
![preview](https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=dark&date=20092024)

```md
`https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=dark&year=2025&color=f0f8ff&bg-color=0c0c0c&border=f0f8ff`
```
![preview](https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=dark&year=2025&color=f0f8ff&bg-color=0c0c0c&border=f0f8ff)

Full parameter list and defaults: [Usage](#-usage).

---

## 🚀 Quick Start

1. **[Fork this repo](https://github.com/MrDeveloperJIS/github-profile-calendar-graph/fork)**.
2. **Create a GitHub Personal Access Token** — see [guide below](#-creating-a-github-personal-access-token).
3. **Deploy to Vercel** and set two environment variables — see [Deployment](#️-deployment).
4. **Embed the image URL** in your profile README — see [Usage](#-usage).

---

## 🔑 Creating a GitHub Personal Access Token

Needs a **classic** token with only the **`read:user`** scope — fine-grained PATs don't reliably support the GraphQL field this project relies on.

<details>
<summary><strong>Step-by-step guide</strong> (click to expand)</summary>

1. `https://github.com/settings/tokens` → **Generate new token → Generate new token (classic)**.
2. Name it (e.g. `github-profile-calendar-graph`), set an expiration.
3. Under **Select scopes**, check **only** `read:user`.
4. **Generate token** and copy it immediately — GitHub only shows it once.
5. Don't commit it to the repo — it goes into Vercel's environment variables only (see [Deployment](#️-deployment)), used server-side, never exposed to viewers of your README.

> A user's *private* contributions only show if they've enabled "Include private contributions on my profile" — same rule as GitHub's own profile page.
> **Token expired?** Generate a new one, update `GH_TOKEN` in Vercel, redeploy.

</details>

---

## ⚙️ Deployment

1. Import your forked repo at **[Vercel](https://vercel.com/new)** — no build settings needed.
2. Set environment variables under Project → Settings → Environment Variables:

   | Variable | Example | Description |
   |---|---|---|
   | `GH_TOKEN` | `ghp_xxxxxxxxxxxxxxxxxxxx` | Classic PAT, `read:user` scope only |
   | `USERNAMES` | `octocat` or `octocat,mona,hubot` | Comma-separated allowlist. **No spaces.** |

3. Deploy, then test in a browser: `https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME`

---

## 📖 Usage

```md
![contribution calendar](https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME)
```

See it rendered: [Examples](#️-examples).

| Param | Default | Example | Description |
|---|---|---|---|
| `user` | — | `?user=octocat` | Required. Must be in the `USERNAMES` allowlist |
| `theme` | `light` | `?theme=dark` | `light` or `dark` |
| `year` | full history | `?year=2023` | Jan 1 of that year → today |
| `date` | — | `?date=15022025` | Exact start date, `ddmmyyyy` → today. More specific than `year`; wins if both are given |
| `width` | `512` | `?width=760` | Card width in px. Clamped 200–2000 |
| `border-radius` | `0` | `?border-radius=12` | Corner radius, px. Clamped 0–50 *(was `radius`)* |
| `border-width` | `1` | `?border-width=2` | Border width, px, `0` = none. Clamped 0–10 *(was `border`)* |
| `speed` | `40` | `?speed=60` | Scroll speed, px/sec. Clamped 5–300 |
| `color` | theme default | `?color=ff8800` | Text color (labels) |
| `bg-color` | theme default | `?bg-color=1a1a2e` | Background color |
| `border` | theme default | `?border=ff8800` | Border color (no effect if `border-width=0`) |

Hex values have **no leading `#`** (e.g. `ff8800`). Invalid numeric params return an error card; invalid colors just fall back to the theme default. An invalid `date` (bad format, or a calendar date that doesn't exist, e.g. `30022026`) also returns an error card.

<details>
<summary><strong>Auto light/dark switching</strong> (optional, click to expand)</summary>

GitHub also supports switching by viewer color scheme via `<picture>`:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME&theme=dark">
  <source media="(prefers-color-scheme: light)" srcset="https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME&theme=light">
  <img alt="contribution calendar" src="https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME&theme=light">
</picture>
```

</details>

---

## 🛠️ Local development

```bash
cp .env.example .env
# fill in GH_TOKEN and USERNAMES

node dev-server.js
# or: npm start
```

Visit `http://localhost:9000/api/calendar?user=YOUR_USERNAME`. `dev-server.js` runs the exact same `api/calendar.js` handler as production, using only Node's built-in `http` module — no CLI or dependencies needed.

Prefer the Vercel CLI instead? `npm install -g vercel && vercel dev` (or `npm run dev` once installed) reads the same `.env` and is closer to Vercel's real runtime — don't run both at once, they share port 9000.

---

## ❓ Troubleshooting

<details>
<summary><strong>Common issues</strong> (click to expand)</summary>

| Symptom | Likely cause |
|---|---|
| "Deploy your own, or add this username..." | Username not in `USERNAMES`, or typo/case mismatch |
| Image doesn't load (broken icon) | Wrong deployment URL, or function errored — check Vercel logs |
| `fetch is not defined` in function logs | Node.js version < 18 — `package.json` pins `>=18`; check Project → Settings → General → Node.js Version |
| Contribution counts look low | User hasn't enabled "include private contributions" |
| Token stopped working | PAT expired — regenerate and update `GH_TOKEN` |

</details>

---

## 📄 License

[MIT](./LICENSE) — Md. Jahidul Islam Sujan. Inspired by GitHub's own contribution graph; not affiliated with or endorsed by GitHub.