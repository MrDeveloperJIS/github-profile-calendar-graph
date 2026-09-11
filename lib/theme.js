// Single source of truth for all colors used across the card.
//
// - `squares` matches GitHub's own 5-level contribution scale exactly.
// - `background` is the custom card background (confirmed: #f0f8ff light / #0c0c0c dark).
// - `text` / `subtext` / `border` are chosen for contrast against each background.

const THEMES = {
    light: {
        background: '#f0f8ff',
        text: '#24292f',
        subtext: '#57606a',
        border: '#d0d7de',
        squares: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    },
    dark: {
        background: '#0c0c0c',
        text: '#c9d1d9',
        subtext: '#8b949e',
        border: '#30363d',
        squares: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
    },
};

const HEX6_RE = /^[0-9a-fA-F]{6}$/;
const HEX3_RE = /^[0-9a-fA-F]{3}$/;

/**
 * @param {string} name - 'light' | 'dark' (anything else falls back to 'light')
 */
function getTheme(name) {
    return THEMES[name] ? THEMES[name] : THEMES.light;
}

/**
 * Validates a `?color=`/`?bg-color=`/`?border=` value and normalizes it to a
 * '#rrggbb' string ready to drop straight into an SVG fill/stroke attribute.
 *
 * Per this project's URL convention, values are passed *without* a leading
 * `#` (e.g. `ff8800`) to avoid URL-encoding — but a leading `#` is tolerated
 * here rather than rejected, since stripping it costs nothing. 3-digit
 * shorthand (`f80`) is expanded to 6 digits. Anything else (wrong length,
 * non-hex characters, empty/undefined) returns null so the caller can fall
 * back to the theme default — colors fail soft, they never error the card.
 *
 * @param {string|undefined} value
 * @returns {string|null}
 */
function sanitizeHexColor(value) {
    if (value === undefined || value === null) return null;
    const raw = String(value).trim().replace(/^#/, '');
    if (HEX6_RE.test(raw)) return `#${raw.toLowerCase()}`;
    if (HEX3_RE.test(raw)) {
        const expanded = raw.toLowerCase().split('').map((c) => c + c).join('');
        return `#${expanded}`;
    }
    return null;
}

module.exports = { THEMES, getTheme, sanitizeHexColor };