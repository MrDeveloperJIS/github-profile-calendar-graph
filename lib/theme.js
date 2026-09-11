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

/**
 * @param {string} name - 'light' | 'dark' (anything else falls back to 'light')
 */
function getTheme(name) {
    return THEMES[name] ? THEMES[name] : THEMES.light;
}

module.exports = { THEMES, getTheme };