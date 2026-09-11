const { getTheme } = require('./theme');

const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Renders a small, theme-matched SVG shown instead of a broken image icon
 * when a username isn't allowlisted or an upstream GitHub call fails.
 *
 * @param {object} opts
 * @param {'light'|'dark'} [opts.theme]
 * @param {string[]} [opts.lines] - message, one line per array entry
 * @param {number} [opts.width]
 */
function renderErrorCard({ theme = 'light', lines = ['Something went wrong'], width = 512 }) {
    const t = getTheme(theme);
    const lineHeight = 18;
    const height = 60 + lines.length * lineHeight;
    const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

    const tspans = lines
        .map((line, i) => `<tspan x="50%" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
        .join('');

    const ariaLabel = escapeXml(lines.join(' — '));

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" role="img" aria-label="${ariaLabel}">
  <rect width="100%" height="100%" fill="${t.background}" stroke="${t.border}" />
  <text x="50%" y="${startY}" text-anchor="middle" font-family="${FONT_STACK}" font-size="13" fill="${t.text}">${tspans}</text>
</svg>`;
}

module.exports = { renderErrorCard };