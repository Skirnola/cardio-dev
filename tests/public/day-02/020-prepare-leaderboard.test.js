import { expect, it } from "vitest";
import { prepareLeaderboard } from "../../../src/exercises/day-02/020-prepare-leaderboard";
it("keeps the best active score for each player, resolves ties deterministically, and assigns ranks from the sorted order", () => {
    const entries = [
        {
            playerId: "p1",
            displayName: "Zoe",
            score: 18,
            updatedAt: "2024-05-01T09:00:00.000Z",
            active: true,
        },
        {
            playerId: "p2",
            displayName: "Ana",
            score: 22,
            updatedAt: "2024-05-01T09:00:00.000Z",
            active: false,
        },
        {
            playerId: "p1",
            displayName: "Zoe",
            score: 24,
            updatedAt: "2024-05-03T09:00:00.000Z",
            active: true,
        },
        {
            playerId: "p3",
            displayName: "Bea",
            score: 24,
            updatedAt: "2024-05-02T09:00:00.000Z",
            active: true,
        },
        {
            playerId: "p4",
            displayName: "Cal",
            score: 24,
            updatedAt: "2024-05-02T09:00:00.000Z",
            active: true,
        },
    ];
    const snapshot = JSON.parse(JSON.stringify(entries));
    expect(prepareLeaderboard(entries)).toEqual([
        { rank: 1, playerId: "p3", displayName: "Bea", score: 24 },
        { rank: 2, playerId: "p4", displayName: "Cal", score: 24 },
        { rank: 3, playerId: "p1", displayName: "Zoe", score: 24 },
    ]);
    expect(entries).toEqual(snapshot);
});
