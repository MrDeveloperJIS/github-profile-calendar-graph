# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-09-11

### Added

- `date` query parameter — exact start date in `ddmmyyyy` format (e.g.
  `?date=15032023`), running through to today, same shape as `year` but
  precise to the day. Rejects malformed input and calendar dates that don't
  exist (e.g. `31042024`, since April has 30 days) with an error card rather
  than silently rolling over to the next month. **If both `date` and `year` are given, `date` takes precedence.**

- `color` query parameter — overrides card text color (username, month/day labels,
  year label).
- `bg-color` query parameter — overrides card background color.
- `border` query parameter (reused name, new meaning) — overrides card border color.
  Has no effect when `border-width=0`.

### Changed

- Sticky year label now switches to the next year only after that year's **December**
  column has fully scrolled off the left edge, instead of switching right after the
  new year's **January** column disappeared. Fixes an early/premature label flip.

- **`radius` renamed to `border-radius`.** Existing embeds using `?radius=` must be
  updated — the old name is no longer recognized.
- **`border` renamed to `border-width`.** Existing embeds using `?border=<number>`
  must be updated to `?border-width=<number>` — the `border` parameter name is now
  reused for border **color** (see below) and no longer accepts a numeric width.

### Notes

- Contribution-square grid colors remain fixed to GitHub's color scale and are
  **not** affected by `color`, `bg-color`, or `border` — this is intentional, to
  keep the card recognizable as a GitHub-style contribution graph.
- Hex color values are passed **without** the leading `#` (e.g. `ff8800`) to avoid
  URL-encoding — a leading `#` is not accepted.

## [1.0.0] - 2026-09-11

### Added

- Initial release of the animated GitHub-style contribution calendar card.
- `/api/calendar` Vercel Serverless Function that queries GitHub's GraphQL API for a
  user's account creation date and `contributionsCollection` daily data.
- Continuously scrolling SVG/SMIL animation (right → left), with no GIF and no
  client-side JavaScript required.
- Light and dark themes (`?theme=light` / `?theme=dark`) matching GitHub's own
  contribution graph color scales.
- Full contribution history by default, with an optional custom start year (`?year=`, runs through to today rather than stopping at that year's end).
- Configurable card chrome: `?width=`, `?radius=`, `?border=`, and `?speed=` query
  parameters, all input-validated and clamped to safe ranges.
- Sticky year label that switches at the exact column boundary between years.
- `USERNAMES` allowlist environment variable to restrict which GitHub accounts a
  deployment will render, protecting the `GH_TOKEN` from open scraping.
- Response caching (`s-maxage=21600, stale-while-revalidate=43200`) to limit GitHub
  API calls regardless of README view volume.
- `dev-server.js`: a dependency-free local dev server for running `/api/calendar`
  without installing the Vercel CLI.
- `.env.example` for local configuration of `GH_TOKEN` and `USERNAMES`.
- MIT License.

---

[1.1.0]: https://github.com/MrDeveloperJIS/github-profile-calendar-graph/releases/tag/v1.1.0
[1.0.0]: https://github.com/MrDeveloperJIS/github-profile-calendar-graph/releases/tag/v1.0.0