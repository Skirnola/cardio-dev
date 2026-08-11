export type LeaderboardEntry = {
  playerId: string;
  displayName: string;
  score: number;
  updatedAt: string;
  active: boolean;
};

export type LeaderboardRow = {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
};

export function prepareLeaderboard(entries: readonly LeaderboardEntry[]): LeaderboardRow[] {
  throw new Error("Not implemented");
}
