# GitHub Readme Profile Calendar Graph

An animated, self-hosted GitHub-style **contribution calendar card** you can embed in your
GitHub profile README — scrolling continuously from right to left, styled to match GitHub's
own contribution graph, in light or dark mode.

Built with plain JavaScript and deployed as Vercel Serverless Functions. No frontend
framework, no build step, no database.

```md
![contribution calendar](https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME&theme=dark)
```

See [Usage](#-usage) for the full list of query parameters (theme, year, width, radius, border, speed).

---

## Table of Contents

- [Features](#-features)
- [Preview](#️-preview)
- [Quick Start](#-quick-start)
- [Creating a GitHub Personal Access Token](#-creating-a-github-personal-access-token)
- [Deployment](#️-deployment)
- [Usage](#-usage)
  - [Query parameters](#query-parameters)
  - [Examples](#examples)
  - [Auto light/dark switching](#auto-lightdark-switching-optional)
- [Design details](#-design-details)
- [How it works](#-how-it-works)
- [Local development](#️-local-development)
  - [Option A — plain Node, no CLI](#option-a--plain-node-no-cli-recommended-if-you-cant-install-the-vercel-cli)
  - [Option B — Vercel CLI](#option-b--vercel-cli)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)
- [Credits](#-credits)

---

## ✨ Features

- 🟩 **Pixel-matches GitHub's own contribution graph colors** (light and dark scales)
- 🔁 **Continuously scrolling animation** — the grid slides right → left in an infinite loop,
  built as a single animated SVG (no GIF, no client-side JS, no external image libraries)
- 📆 **Full history by default** — shows every week from your account's creation year to today,
  or a single year via `?year=2023`
- 🌗 **Light / dark theme** via `?theme=light` or `?theme=dark`
- 🔒 **Allowlisted usernames** — you control exactly which GitHub usernames your deployment
  will render, via a single `USERNAMES` environment variable, so your GitHub token can't be
  used to scrape arbitrary accounts through your endpoint
- 📱 **Responsive width** — defaults to 512px, scales to 100% on narrower viewports
- ⚡ **Cached at the edge** — data refreshes a few times a day, not on every profile view

---

## 🖼️ Preview

| Theme | Preview |
|---|---|
| Light theme | ![preview-light](https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=light&year=2020) |
| Dark theme | ![preview-dark](https://github-profile-calendar-graph.vercel.app/api/calendar?user=MrDeveloperJIS&theme=dark&year=2020) |

---

## 🚀 Quick Start

1. **Fork or clone this repo.**
   ```bash
   git clone https://github.com/MrDeveloperJIS/github-profile-calendar-graph.git
   ```
2. **Create a GitHub Personal Access Token** — see [full guide below](#-creating-a-github-personal-access-token).
3. **Deploy to Vercel** and set two environment variables — see [Deployment](#-deployment).
4. **Embed the image URL** in your profile README — see [Usage](#-usage).

---

## 🔑 Creating a GitHub Personal Access Token

This project needs a token to read contribution data from GitHub's GraphQL API. Follow these
steps carefully — the token only needs **one, minimal, read-only scope**.

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
   (direct link: `https://github.com/settings/tokens`).
   > We use a **classic** token, not a fine-grained one — fine-grained PATs don't yet reliably
   > support the GraphQL `contributionsCollection` field this project relies on.
2. Click **Generate new token → Generate new token (classic)**.
3. Give it a descriptive name, e.g. `github-profile-calendar-graph`.
4. Set an **expiration** (90 days or 1 year are reasonable — you'll just need to rotate it in
   Vercel when it expires; GitHub will email you a reminder).
5. Under **Select scopes**, check **only**:
   - ☑️ `read:user`
   - Leave everything else unchecked. This project never touches repositories, issues, or
     any write access — it only reads public profile/contribution data.
6. Click **Generate token** and **copy it immediately** — GitHub only shows it once.
7. **Do not commit this token to the repo.** It goes into Vercel's environment variables only
   (see [Deployment](#-deployment)) and is used exclusively server-side, inside the serverless
   function — it is never exposed to whoever views your README or image URL.

> **Note on private contributions:** a given user's *private* contributions only appear in
> their graph if that user has "Include private contributions on my profile" enabled in their
> own GitHub settings — this project respects the same rule GitHub's own profile page does,
> and cannot bypass it with a token.

> **Rotating an expired token:** generate a new one following the same steps, then update the
> `GH_TOKEN` value in your Vercel project settings and redeploy (or just save — Vercel
> redeploys automatically on env var changes for the next request).

---

## ⚙️ Deployment

1. **Import the project into Vercel:**
   - [vercel.com/new](https://vercel.com/new) → Import Git Repository → select your fork.
   - No build settings needed — Vercel auto-detects the `/api/*.js` files as Serverless
     Functions.
2. **Node.js version:** `package.json` pins `"engines": { "node": ">=18" }`, so Vercel should
   select a compatible runtime automatically — `lib/github.js` relies on the global `fetch`,
   which only exists in Node 18+. If you ever see `fetch is not defined` in the function logs,
   double-check the version under Project → Settings → General → Node.js Version.
3. **Set environment variables** under Project → Settings → Environment Variables:

   | Variable | Example | Description |
   |---|---|---|
   | `GH_TOKEN` | `ghp_xxxxxxxxxxxxxxxxxxxx` | The classic PAT from the step above (`read:user` scope only) |
   | `USERNAMES` | `octocat` or `octocat,mona,hubot` | Comma-separated allowlist of GitHub usernames this deployment will render. **No spaces.** |

4. **Deploy.** Vercel builds and gives you a URL like `https://readme-profile-calendar-graph.vercel.app`.
5. **Test it directly** in a browser:
   ```
   https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME
   ```
   You should see your contribution calendar scrolling. If you instead see a small card saying
   *"Deploy your own, or add this username to the `USERNAMES` variable"*, double-check that
   your username is spelled exactly as in `USERNAMES` (case-sensitive) and that you redeployed
   after setting it.

---

## 📖 Usage

Embed the image in any GitHub-flavored Markdown — typically your **profile README**
(`github.com/YOUR_USERNAME/YOUR_USERNAME/README.md`):

```md
![contribution calendar](https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME)
```

### Query parameters

All numeric params take a plain unit-less value (e.g. `?radius=12`, not `12px`).

| Param | Required | Default | Example | Description |
|---|---|---|---|---|
| `user` | Yes | — | `?user=octocat` | Must be listed in the deployment's `USERNAMES` env var |
| `theme` | No | `light` | `?theme=dark` | `light` or `dark`, matches GitHub's own two palettes |
| `year` | No | account-creation-year → today | `?year=2023` | Show a single calendar year instead of full history |
| `width` | No | `512` | `?width=760` | Card width in px. Only matters on viewports wide enough to show it — on narrower screens the `<img>` still shrinks to fit its container. Clamped to 200–2000. |
| `radius` | No | `0` | `?radius=12` | Corner radius of the card, in px. Clamped to 0–50. |
| `border` | No | `1` | `?border=2` | Card border width, in px. Solid, colored to match the theme. `0` removes the border entirely. Clamped to 0–10. |
| `speed` | No | `40` | `?speed=60` | Scroll speed, in px/sec. Higher = faster ticker. Clamped to 5–300. |

Sending a non-numeric value for `width`, `radius`, `border`, or `speed` returns a small error card instead of the calendar.

### Examples

Default: full history, light theme
```md
![calendar](https://your-project.vercel.app/api/calendar?user=octocat)
```

Dark theme
```md
![calendar](https://your-project.vercel.app/api/calendar?user=octocat&theme=dark)
```

A single year
```md
![calendar](https://your-project.vercel.app/api/calendar?user=octocat&year=2023&theme=dark)
```

### Auto light/dark switching (optional)

GitHub supports switching images based on the viewer's color scheme using the `<picture>`
tag in HTML-flavored Markdown:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME&theme=dark">
  <source media="(prefers-color-scheme: light)" srcset="https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME&theme=light">
  <img alt="contribution calendar" src="https://your-project.vercel.app/api/calendar?user=YOUR_USERNAME&theme=light">
</picture>
```

---

## 🎨 Design details

- **Contribution square colors** match GitHub's exact scale:
  - Light: `#ebedf0` → `#9be9a8` → `#40c463` → `#30a14e` → `#216e39`
  - Dark: `#161b22` → `#0e4429` → `#006d32` → `#26a641` → `#39d353`
- **Card background:** `#f0f8ff` (light theme), `#0c0c0c` (dark theme)
- **Animation:** the full grid scrolls continuously right → left in an infinite loop, built
  entirely with native SVG/SMIL animation — no GIF, no client-side JavaScript, so it renders
  correctly as a plain `<img>` inside GitHub's sanitized README HTML. Scroll speed is
  configurable via `?speed=` (default `40`px/sec).
- **Sticky year label:** the year in the top-left corner doesn't scroll away with the rest of
  the grid — it's a fixed label that stays put through the whole year and switches to the next
  one at the exact instant that year's January column reaches the left edge. No early preview,
  no blank gap in between — one year is always showing.
- **Card chrome:** corner radius (`?radius=`, default `0`) and border width (`?border=`,
  default `1`, `0` to remove) are both configurable and themed to match light/dark mode.
- **Sizing:** `width="512"` by default, adjustable via `?width=`; the SVG's `viewBox` lets it
  scale down to `100%` of its container on smaller screens automatically — GitHub's markdown
  body CSS already applies `max-width: 100%` to images, so `?width=` sets a ceiling for wide
  screens without overflowing narrow ones.

---

## 🧩 How it works

1. A request for `/api/calendar?user=X` checks `X` against the `USERNAMES` allowlist.
2. If allowed, the function queries **GitHub's GraphQL API** for the account's creation date
   and its `contributionsCollection` daily data (chunked into 1-year windows, since GitHub
   caps each query to a 1-year range).
3. The daily counts are mapped onto a 7-row weekly grid and rendered as an animated SVG string.
4. The response is served as `image/svg+xml` with cache headers (`s-maxage=21600,
   stale-while-revalidate=43200` — roughly a 6-hour fresh window, serving stale for up to 12
   hours while revalidating in the background), so the GitHub API is called only a handful of
   times a day per username regardless of how many people view your README.

---

## 🛠️ Local development

Both options below read the same `.env` file and serve the same `/api/calendar` handler —
pick whichever fits your machine. Don't run both at once; they'll fight over port 9000.

### Option A — plain Node, no CLI (recommended if you can't install the Vercel CLI)

Useful on locked-down machines (e.g. an office laptop) where installing global npm packages
isn't an option. `dev-server.js` is a small, dependency-free script included in this repo that
runs the exact same `api/calendar.js` handler as production, using only Node's built-in `http`
module.

```bash
cp .env.example .env
# edit .env: fill in your real GH_TOKEN and USERNAMES

node dev-server.js
# or: npm start
```

Then visit `http://localhost:9000/api/calendar?user=YOUR_USERNAME`. Try `&theme=dark` and a
username **not** in `USERNAMES` too, to confirm the rejection card renders correctly. Stop the
server with `Ctrl+C`; re-run `node dev-server.js` after any code change to pick it up.

Deployment doesn't need the CLI either — see [Deployment](#️-deployment) above, which is done
entirely through the Vercel website.

### Option B — Vercel CLI

Closer to Vercel's real production runtime, if you're able to install global npm packages.
This project has no runtime dependencies, so nothing gets installed into `node_modules` —
`vercel dev` will detect the `/api` folder and run it directly, prompting you to link/create a
Vercel project the first time:

```bash
npm install -g vercel
vercel dev
```

Once the CLI is installed, `npm run dev` (which just runs `vercel dev`) works too.

Then visit `http://localhost:9000/api/calendar?user=YOUR_USERNAME`. Create a `.env` file
(copy `.env.example`) with your own `GH_TOKEN` and `USERNAMES` first — `vercel dev` reads it
automatically.

---

## ❓ Troubleshooting

| Symptom | Likely cause |
|---|---|
| Card shows "Deploy your own, or add this username..." | Username not in `USERNAMES`, or typo/case mismatch |
| Image doesn't load at all (broken icon) | Deployment URL is wrong, or the function errored — check Vercel's function logs |
| Contribution counts look lower than expected | The user hasn't enabled "include private contributions" on their GitHub profile |
| Token stopped working | PAT expired — generate a new one and update `GH_TOKEN` in Vercel |

---

## 📄 License

MIT — Md. Jahidul Islam Sujan.

---

## 🙌 Credits

Inspired by GitHub's own contribution graph. Not affiliated with or endorsed by GitHub.