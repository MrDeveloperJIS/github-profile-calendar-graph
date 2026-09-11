// Talks to GitHub's GraphQL API. Requires a classic PAT with only the
// `read:user` scope (see README.md for setup). Uses the global `fetch`
// available in Vercel's Node.js 18+ runtime — no extra dependency needed.

const GRAPHQL_URL = 'https://api.github.com/graphql';

class GitHubApiError extends Error { }

async function graphqlRequest(query, variables, token) {
    const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
            Authorization: `bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'readme-profile-calendar-graph',
        },
        body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
        throw new GitHubApiError(`GitHub API responded with HTTP ${res.status}`);
    }

    const json = await res.json();

    if (json.errors && json.errors.length > 0) {
        throw new GitHubApiError(json.errors.map((e) => e.message).join('; '));
    }

    return json.data;
}

async function fetchUserCreatedAt(login, token) {
    const query = `
    query($login: String!) {
      user(login: $login) {
        createdAt
      }
    }
  `;
    const data = await graphqlRequest(query, { login }, token);
    if (!data.user) {
        throw new GitHubApiError(`GitHub user "${login}" was not found`);
    }
    return data.user.createdAt;
}

async function fetchContributionWindow(login, from, to, token) {
    const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `;
    const data = await graphqlRequest(query, { login, from, to }, token);
    if (!data.user) {
        throw new GitHubApiError(`GitHub user "${login}" was not found`);
    }

    const days = [];
    data.user.contributionsCollection.contributionCalendar.weeks.forEach((week) => {
        week.contributionDays.forEach((day) => {
            days.push({ date: day.date, count: day.contributionCount });
        });
    });
    return days;
}

/**
 * Fetches daily contribution counts across an arbitrary date range by
 * chunking it into <=1-year windows (GitHub's API limit) and running the
 * requests in parallel.
 *
 * @param {(start: Date, end: Date) => {from: string, to: string}[]} chunkFn
 */
async function fetchDailyCounts(login, startDate, endDate, token, chunkFn) {
    const windows = chunkFn(startDate, endDate);

    const results = await Promise.all(
        windows.map((w) => fetchContributionWindow(login, w.from, w.to, token))
    );

    const map = new Map();
    results.forEach((days) => {
        days.forEach((d) => {
            map.set(d.date, d.count);
        });
    });
    return map;
}

module.exports = { fetchUserCreatedAt, fetchDailyCounts, GitHubApiError };