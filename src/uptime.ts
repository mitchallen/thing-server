// Formats process.uptime() as an HH:MM:SS string.
//
// Vendored from @mitchallen/uptime 0.0.8 (MIT, Copyright 2018 Mitch Allen)
// rather than carried as a dependency: it is a dozen lines, ships no type
// declarations, and was the only runtime dependency outside express, cors and
// swagger-ui-express.

// padStart rather than the original's `(n < 10 ? '0' : '') + n` — same output
// for every input, but branch-free, so it does not leave a permanently
// unreachable branch in coverage (the suite never runs long enough to see a
// two-digit component).
const pad = (n: number): string => String(n).padStart(2, '0');

export const toHHMMSS = (): string => {
    const t = process.uptime();

    const hours   = Math.floor(t / (60 * 60));
    const minutes = Math.floor((t % (60 * 60)) / 60);
    const seconds = Math.floor(t % 60);

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
