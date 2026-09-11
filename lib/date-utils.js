// Pure date/grid math — no network calls, no dependencies. Safe to unit-test in isolation.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUTCDate(year, month, day) {
    return new Date(Date.UTC(year, month, day));
}

function formatDate(date) {
    return date.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function addDays(date, n) {
    return new Date(date.getTime() + n * MS_PER_DAY);
}

function startOfUTCDay(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Default range: Jan 1 of the account's creation year -> today (UTC).
 * @param {string} createdAtIso - ISO timestamp from GitHub's `user.createdAt`
 */
function getDefaultRange(createdAtIso) {
    const created = new Date(createdAtIso);
    const startDate = toUTCDate(created.getUTCFullYear(), 0, 1);
    const endDate = startOfUTCDay(new Date());
    return { startDate, endDate };
}

/**
 * Single year -> today, e.g. `?year=2023`. Always runs through to today
 * rather than stopping at Dec 31 of that year — same shape as the default
 * range, just with a custom start year instead of the account's creation
 * year.
 */
function getYearRange(year) {
    const y = Number(year);
    const startDate = toUTCDate(y, 0, 1);
    const endDate = startOfUTCDay(new Date());
    return { startDate, endDate };
}

/**
 * GitHub's `contributionsCollection` caps the `from`/`to` window at 1 year.
 * Chunk an arbitrary range (e.g. "account creation -> today" across many
 * years) into <=1-year windows so each can be fetched with its own query.
 */
function chunkDateRangeByYear(startDate, endDate) {
    const chunks = [];
    let chunkStart = new Date(startDate.getTime());

    while (chunkStart.getTime() <= endDate.getTime()) {
        let chunkEnd = addDays(chunkStart, 365);
        if (chunkEnd.getTime() > endDate.getTime()) {
            chunkEnd = new Date(endDate.getTime());
        }
        chunks.push({ from: chunkStart.toISOString(), to: chunkEnd.toISOString() });
        chunkStart = addDays(chunkEnd, 1);
    }

    return chunks;
}

/**
 * Builds a Sunday-aligned weekly grid (GitHub's own layout) covering
 * startDate..endDate inclusive. Days outside the range but needed to fill a
 * partial first/last week are included with `inRange: false` so every week
 * column has exactly 7 rows (renders as a blank cell).
 *
 * @param {Map<string, number>} dailyCountMap - 'YYYY-MM-DD' -> contribution count
 */
function buildGrid(dailyCountMap, startDate, endDate) {
    const gridStart = addDays(startDate, -startDate.getUTCDay()); // back up to Sunday
    const gridEnd = addDays(endDate, 6 - endDate.getUTCDay()); // forward to Saturday

    const weeks = [];
    let cursor = gridStart;
    let totalContributions = 0;
    let maxDailyCount = 0;

    while (cursor.getTime() <= gridEnd.getTime()) {
        const week = [];
        for (let i = 0; i < 7; i += 1) {
            const inRange = cursor.getTime() >= startDate.getTime() && cursor.getTime() <= endDate.getTime();
            const dateStr = formatDate(cursor);
            const count = inRange ? (dailyCountMap.get(dateStr) || 0) : 0;

            if (inRange) {
                totalContributions += count;
                if (count > maxDailyCount) maxDailyCount = count;
            }

            week.push({ date: dateStr, count, inRange });
            cursor = addDays(cursor, 1);
        }
        weeks.push(week);
    }

    return { weeks, totalContributions, maxDailyCount };
}

module.exports = {
    toUTCDate,
    formatDate,
    addDays,
    startOfUTCDay,
    getDefaultRange,
    getYearRange,
    chunkDateRangeByYear,
    buildGrid,
};