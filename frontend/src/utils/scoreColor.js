export function getScoreColor(score) {
    if (score == null || !Number.isFinite(Number(score))) {
        return '#9ca3af';
    }

    const value = Number(score);

    if (value >= 85) return '#22c55e'; // green
    if (value >= 70) return '#4ade80'; // light green
    if (value >= 55) return '#facc15'; // amber
    if (value >= 40) return '#fb923c'; // orange
    return '#ef4444'; // red
}

