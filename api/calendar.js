const { isAllowed } = require('../lib/allowlist');
const { fetchUserCreatedAt, fetchDailyCounts, GitHubApiError } = require('../lib/github');
const { getDefaultRange, getYearRange, getDateRange, chunkDateRangeByYear, buildGrid } = require('../lib/date-utils');
const { buildCalendarSvg } = require('../lib/svg-builder');
const { renderErrorCard } = require('../lib/error-card');
const { sanitizeHexColor } = require('../lib/theme');

// Data changes only a couple of times a day, and each deployment only has a
// handful of viewers — cache hard at the CDN edge so the GitHub API is only
// hit a few times a day per username, regardless of README view count.
const SUCCESS_CACHE = 'public, s-maxage=21600, stale-while-revalidate=43200'; // 6h fresh, 12h stale-ok
const ERROR_CACHE = 'public, s-maxage=300, stale-while-revalidate=600'; // don't cache failures long

// Unit-less numeric query params: ?width=700&border-radius=12&border-width=2&speed=60 etc.
const NUMERIC_PARAMS = {
    width: { def: 512, min: 200, max: 2000 },
    'border-radius': { def: 0, min: 0, max: 50 },
    'border-width': { def: 1, min: 0, max: 10 },
    speed: { def: 40, min: 5, max: 300 },
};

function parseNumericParam(value, { def, min, max }) {
    if (value === undefined) return def;
    if (!/^\d+$/.test(String(value))) return null; // invalid: not a plain non-negative integer
    return Math.min(Math.max(parseInt(value, 10), min), max);
}

function sendSvg(res, status, cacheControl, svg) {
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', cacheControl);
    res.status(status).send(svg);
}

module.exports = async (req, res) => {
    const {
        user,
        year,
        date,
        theme: themeParam,
        width: widthParam,
        'border-radius': borderRadiusParam,
        'border-width': borderWidthParam,
        speed: speedParam,
        color: colorParam,
        'bg-color': bgColorParam,
        border: borderColorParam,
    } = req.query;
    const theme = themeParam === 'dark' ? 'dark' : 'light';

    const width = parseNumericParam(widthParam, NUMERIC_PARAMS.width);
    const borderRadius = parseNumericParam(borderRadiusParam, NUMERIC_PARAMS['border-radius']);
    const borderWidth = parseNumericParam(borderWidthParam, NUMERIC_PARAMS['border-width']);
    const speed = parseNumericParam(speedParam, NUMERIC_PARAMS.speed);

    if ([width, borderRadius, borderWidth, speed].some((v) => v === null)) {
        sendSvg(
            res,
            400,
            ERROR_CACHE,
            renderErrorCard({
                theme,
                lines: ['Invalid width, border-radius,', 'border-width, or speed — numbers only'],
            })
        );
        return;
    }

    // Colors are optional and fail soft: an invalid/malformed value just
    // falls back to the theme default for that property rather than
    // erroring out the whole card (unlike the numeric params above, which
    // reject the request — a bad color is cosmetic, a bad size can break
    // layout).
    const colorOverrides = {
        text: sanitizeHexColor(colorParam) || undefined,
        background: sanitizeHexColor(bgColorParam) || undefined,
        border: sanitizeHexColor(borderColorParam) || undefined,
    };

    if (!user || !isAllowed(user)) {
        sendSvg(
            res,
            403,
            ERROR_CACHE,
            renderErrorCard({
                theme,
                width,
                lines: ['Deploy your own, or add this', 'username to the USERNAMES variable'],
            })
        );
        return;
    }

    const token = process.env.GH_TOKEN;
    if (!token) {
        sendSvg(
            res,
            500,
            ERROR_CACHE,
            renderErrorCard({ theme, width, lines: ['Server misconfigured:', 'GH_TOKEN is not set'] })
        );
        return;
    }

    // `date` is more specific than `year` and takes precedence if both are given.
    if (date && !getDateRange(date)) {
        sendSvg(
            res,
            400,
            ERROR_CACHE,
            renderErrorCard({ theme, width, lines: ['Invalid date parameter', 'expected ddmmyyyy'] })
        );
        return;
    }

    if (!date && year && !/^\d{4}$/.test(String(year))) {
        sendSvg(res, 400, ERROR_CACHE, renderErrorCard({ theme, width, lines: ['Invalid year parameter'] }));
        return;
    }

    try {
        const createdAt = await fetchUserCreatedAt(user, token);
        const { startDate, endDate } = date ? getDateRange(date) : year ? getYearRange(year) : getDefaultRange(createdAt);

        if (startDate.getTime() > endDate.getTime()) {
            sendSvg(
                res,
                400,
                ERROR_CACHE,
                renderErrorCard({ theme, width, lines: ['Requested date/year is out of range'] })
            );
            return;
        }

        const dailyCountMap = await fetchDailyCounts(user, startDate, endDate, token, chunkDateRangeByYear);
        const { weeks, totalContributions, maxDailyCount } = buildGrid(dailyCountMap, startDate, endDate);

        const svg = buildCalendarSvg({
            weeks,
            totalContributions,
            maxDailyCount,
            theme,
            width,
            username: user,
            borderRadius,
            borderWidth,
            speed,
            colorOverrides,
        });

        sendSvg(res, 200, SUCCESS_CACHE, svg);
    } catch (err) {
        const message = err instanceof GitHubApiError ? err.message : 'Unexpected server error';
        sendSvg(
            res,
            502,
            ERROR_CACHE,
            renderErrorCard({ theme, width, lines: ['Could not load contribution data', message] })
        );
    }
};