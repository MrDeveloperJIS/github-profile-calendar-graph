// Parses the USERNAMES env var (comma-separated, no spaces) into an
// allowlist, and checks a requested `?user=` against it. This is what keeps
// your deployed GH_TOKEN from being usable to look up arbitrary accounts.

function getAllowedUsernames() {
    const raw = process.env.USERNAMES || '';
    return raw
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
}

function isAllowed(username) {
    if (!username) return false;
    const allowed = getAllowedUsernames();
    return allowed.some((u) => u.toLowerCase() === username.toLowerCase());
}

module.exports = { getAllowedUsernames, isAllowed };