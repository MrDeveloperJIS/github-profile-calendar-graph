const { getTheme } = require('./theme');

const CELL = 11; // square size, px
const GAP = 3; // gap between squares, px
const PITCH = CELL + GAP; // distance between square starts, px
const GUTTER = 28; // fixed column for weekday labels, px
const PAD_X = 10; // breathing room on the left and right edges of the card, px
const LEFT_OFFSET = PAD_X + GUTTER; // total left margin before the squares start
const RIGHT_PAD = PAD_X;
const TOP_PAD = 36; // room for the year + month labels
const BOTTOM_PAD = 8;
const MIN_DURATION_SEC = 20; // minimum time to sweep from oldest -> today
const INITIAL_DELAY_SEC = 0.75; // brief hold on the starting frame before the sweep begins
const PAUSE_SEC = 2; // pause once "today" is reached, before restarting
const MIN_WEEKS_BETWEEN_MONTH_LABELS = 3; // avoid overlapping month labels
const MONTH_LABEL_ABSOLUTE_Y = 30; // where the month label sits, in final rendered pixels
const MONTH_LABEL_LOCAL_Y = MONTH_LABEL_ABSOLUTE_Y - TOP_PAD; // compensates for the group's TOP_PAD shift below
const STICKY_YEAR_X = PAD_X; // the sticky year label lives outside the scrolling strip, pinned to the card
const STICKY_YEAR_Y = 14;

const FONT_STACK = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const LABEL_FONT_SIZE = 11;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAY_ROW_LABELS = { 1: 'M', 3: 'W', 5: 'F' }; // row index (0=Sun) -> label

function escapeXml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Buckets a raw daily count into one of GitHub's 5 visual levels, relative
 * to the busiest day in the fetched range (0 = none, 4 = busiest).
 */
function levelForCount(count, maxDailyCount) {
    if (count === 0) return 0;
    if (maxDailyCount <= 0) return 1;
    const ratio = count / maxDailyCount;
    if (ratio > 0.75) return 4;
    if (ratio > 0.5) return 3;
    if (ratio > 0.25) return 2;
    return 1;
}

// Month labels only — the year is no longer printed inline here, since it's
// rendered as a separate sticky label (see buildStickyYearLabels below).
function buildStrip(weeks, theme) {
    let squares = '';
    let monthLabels = '';
    let lastMonth = null;
    let lastLabelWeekIndex = -Infinity;

    weeks.forEach((week, weekIndex) => {
        const x = weekIndex * PITCH;
        const firstUsableDay = week.find((d) => d.inRange) || week[0];

        if (firstUsableDay) {
            const d = new Date(`${firstUsableDay.date}T00:00:00Z`);
            const month = d.getUTCMonth();
            const farEnoughFromLastLabel = weekIndex - lastLabelWeekIndex >= MIN_WEEKS_BETWEEN_MONTH_LABELS;
            if (month !== lastMonth && d.getUTCDate() <= 7 && farEnoughFromLastLabel) {
                monthLabels += `<text x="${x}" y="${MONTH_LABEL_LOCAL_Y}" font-size="${LABEL_FONT_SIZE}" font-weight="600" fill="${theme.subtext}" font-family="${FONT_STACK}">${MONTH_NAMES[month]}</text>`;
                lastMonth = month;
                lastLabelWeekIndex = weekIndex;
            }
        }

        week.forEach((day, dayIndex) => {
            const y = dayIndex * PITCH;
            if (!day.inRange) {
                squares += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="transparent" />`;
                return;
            }
            const level = levelForCount(day.count, weeks._maxDailyCount || 0);
            const fill = theme.squares[level];
            const title = `${day.count} contribution${day.count === 1 ? '' : 's'} on ${day.date}`;
            squares += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2" fill="${fill}" shape-rendering="crispEdges"><title>${escapeXml(title)}</title></rect>`;
        });
    });

    return `${monthLabels}${squares}`;
}

/**
 * Works out, for every calendar year present in the strip, the week index
 * where the sticky label should switch to that year — the first column
 * whose lead day falls in January. Consecutive segments share that exact
 * boundary (one segment's end is the next one's start), so the label stays
 * visible continuously with no blank frame in between: the old year holds
 * right up until the new year's January column reaches the left edge, then
 * switches instantly.
 */
function computeYearSegments(weeks) {
    const segments = [];

    weeks.forEach((week, weekIndex) => {
        const firstUsableDay = week.find((d) => d.inRange) || week[0];
        if (!firstUsableDay) return;
        const d = new Date(`${firstUsableDay.date}T00:00:00Z`);
        const year = d.getUTCFullYear();
        const month = d.getUTCMonth();

        if (segments.length === 0) {
            segments.push({ year, startWeekIndex: 0 });
            return;
        }

        const lastSegment = segments[segments.length - 1];
        if (month === 0 && year !== lastSegment.year) {
            segments.push({ year, startWeekIndex: weekIndex });
        }
    });

    return segments;
}

/**
 * Renders the sticky year label(s): fixed at the top-left of the card
 * (outside the scrolling/clipped strip), switching between years in sync
 * with the scroll animation via discrete opacity keyframes. Segments share
 * their boundary keyTime exactly, so exactly one label is visible at any
 * given moment — no blank gap between the old year disappearing and the
 * new one appearing.
 */
function buildStickyYearLabels({ weeks, theme, scrollDistance, scrollDuration, totalDuration }) {
    const segments = computeYearSegments(weeks);
    if (segments.length === 0) return '';

    const textAttrs = `x="${STICKY_YEAR_X}" y="${STICKY_YEAR_Y}" font-size="${LABEL_FONT_SIZE}" font-weight="700" fill="${theme.text}" font-family="${FONT_STACK}"`;

    // Nothing to scroll through -> everything is visible at once, so just
    // show the first year statically, no animation needed.
    if (scrollDistance <= 0 || segments.length === 1) {
        return `<text ${textAttrs}>${segments[0].year}</text>`;
    }

    // The keyTime (0-1 fraction of the loop) at which a given week column
    // crosses the left edge of the viewport and disappears off-screen.
    const keyTimeForWeekIndex = (weekIndex) => {
        const localX = weekIndex * PITCH;
        const t = scrollDuration * (localX / scrollDistance);
        return Math.min(Math.max(t / totalDuration, 0), 1);
    };

    return segments
        .map((segment, i) => {
            const startT = i === 0 ? 0 : keyTimeForWeekIndex(segment.startWeekIndex);
            const endT = i === segments.length - 1 ? 1 : keyTimeForWeekIndex(segments[i + 1].startWeekIndex);

            const keyTimes = [0];
            const values = [startT <= 0 ? '1' : '0'];
            if (startT > 0) {
                keyTimes.push(startT.toFixed(4));
                values.push('1');
            }
            if (endT < 1) {
                keyTimes.push(endT.toFixed(4));
                values.push('0');
            }
            if (Number(keyTimes[keyTimes.length - 1]) !== 1) {
                keyTimes.push('1');
                values.push(values[values.length - 1]);
            }

            return `<text ${textAttrs} opacity="${values[0]}">${segment.year}<animate attributeName="opacity" calcMode="discrete" begin="${INITIAL_DELAY_SEC}s" dur="${totalDuration.toFixed(1)}s" repeatCount="indefinite" keyTimes="${keyTimes.join(';')}" values="${values.join(';')}" /></text>`;
        })
        .join('');
}

/**
 * @param {object} opts
 * @param {Array<Array<{date:string,count:number,inRange:boolean}>>} opts.weeks
 * @param {number} opts.totalContributions
 * @param {number} opts.maxDailyCount
 * @param {'light'|'dark'} [opts.theme]
 * @param {number} [opts.width] - card width in px, above ~512 only matters on wider viewports
 * @param {string} [opts.username]
 * @param {number} [opts.radius] - card corner radius in px, default 0
 * @param {number} [opts.borderWidth] - card border (stroke) width in px, default 1, 0 = no border
 * @param {number} [opts.speed] - scroll speed in px/sec, default 40
 */
function buildCalendarSvg({
    weeks,
    totalContributions,
    maxDailyCount,
    theme = 'light',
    width = 512,
    username = '',
    radius = 0,
    borderWidth = 1,
    speed = 40,
}) {
    const t = getTheme(theme);
    weeks._maxDailyCount = maxDailyCount; // small internal hint for buildStrip's level calc

    const contentHeight = TOP_PAD + 7 * PITCH + BOTTOM_PAD;
    const singleWidth = Math.max(weeks.length * PITCH, 1);
    const viewportContentWidth = Math.max(width - LEFT_OFFSET - RIGHT_PAD, 1);

    const stripMarkup = buildStrip(weeks, t);
    const strip = `<g>${stripMarkup}</g>`;

    // The strip sweeps once from oldest (left-aligned) to "today"
    // (right-aligned), pauses for a beat, then jumps back to the start and
    // repeats — rather than looping continuously.
    const scrollDistance = Math.max(singleWidth - viewportContentWidth, 0);
    const startX = LEFT_OFFSET;
    const endX = LEFT_OFFSET - scrollDistance;

    const scrollDuration = Math.max(MIN_DURATION_SEC, scrollDistance / speed);
    const totalDuration = scrollDuration + PAUSE_SEC;
    const holdKeyTime = (scrollDuration / totalDuration).toFixed(4);

    const weekdayLabels = Object.entries(WEEKDAY_ROW_LABELS)
        .map(([row, label]) => {
            const y = TOP_PAD + Number(row) * PITCH + CELL;
            return `<text x="${PAD_X}" y="${y}" font-size="${LABEL_FONT_SIZE}" font-weight="600" fill="${t.subtext}" font-family="${FONT_STACK}">${label}</text>`;
        })
        .join('');

    const stickyYearLabel = buildStickyYearLabels({ weeks, theme: t, scrollDistance, scrollDuration, totalDuration });

    const caption = `${totalContributions.toLocaleString()} contributions${username ? ` for ${username}` : ''}`;

    const bw = Math.max(borderWidth, 0);
    const borderAttrs = bw > 0 ? ` stroke="${t.border}" stroke-width="${bw}"` : '';
    const inset = bw / 2; // keeps the stroke from getting clipped at the viewBox edge

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${contentHeight}" width="${width}" role="img" aria-label="${escapeXml(caption)}" text-rendering="optimizeLegibility">
  <rect x="${inset}" y="${inset}" width="${width - bw}" height="${contentHeight - bw}" rx="${radius}" fill="${t.background}"${borderAttrs} />
  <clipPath id="viewport"><rect x="${LEFT_OFFSET}" y="0" width="${viewportContentWidth}" height="${contentHeight}" /></clipPath>
  <g>${weekdayLabels}</g>
  ${stickyYearLabel}
  <g clip-path="url(#viewport)">
    <g transform="translate(${startX},${TOP_PAD})">
      ${strip}
      <animateTransform attributeName="transform" attributeType="XML" type="translate"
        calcMode="linear"
        begin="${INITIAL_DELAY_SEC}s"
        keyTimes="0;${holdKeyTime};1"
        values="${startX},${TOP_PAD};${endX},${TOP_PAD};${endX},${TOP_PAD}"
        dur="${totalDuration.toFixed(1)}s" repeatCount="indefinite" />
    </g>
  </g>
</svg>`;
}

module.exports = { buildCalendarSvg };