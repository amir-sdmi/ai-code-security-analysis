// NOTE: THIS CODE WAS MADE WITH CHATGPT
function levenshteinDistance(s, t, maxDist) {
  const m = s.length, n = t.length;
  if (Math.abs(m - n) > maxDist) return maxDist + 1;

  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    let minInRow = dp[0];

    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (s[i - 1] === t[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(dp[j], dp[j - 1], prev);
      }
      prev = temp;
      if (dp[j] < minInRow) minInRow = dp[j];
    }
    if (minInRow > maxDist) return maxDist + 1;
  }
  return dp[n];
}

function scoreMatch(songName, query) {
  const name = songName.toLowerCase();
  const q = query.toLowerCase();

  if (name === q) {
    return 100;
  }
  if (name.startsWith(q)) {
    return 75;
  }
  if (name.includes(q)) {
    return 50;
  }

  const maxDist = 2;
  const dist = levenshteinDistance(q, name, maxDist);
  if (dist <= maxDist) {
    return 40 - dist * 10;
  }
  return 0;
}

export function fuzzySearchSongs(songs, query) {
  const scored = [];

  for (const song of songs) {
    const score = scoreMatch(song.name, query);
    if (score > 0) {
      scored.push({ song, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored;
}