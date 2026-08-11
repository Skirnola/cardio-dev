import { expect, it } from "vitest";
import { buildTeamDirectory, type TeamMember } from "../../../src/exercises/day-02/019-build-team-directory";

it("keeps the newest active member for each id, groups members by team, and sorts the rows and names", () => {
  const members: TeamMember[] = [
    {
      id: "m1",
      displayName: "Ava",
      team: "Platform",
      updatedAt: "2024-05-01T10:00:00.000Z",
      active: true,
    },
    {
      id: "m2",
      displayName: "Bo",
      team: "Design",
      updatedAt: "2024-05-02T10:00:00.000Z",
      active: false,
    },
    {
      id: "m1",
      displayName: "Ava Stone",
      team: "Platform",
      updatedAt: "2024-05-03T10:00:00.000Z",
      active: true,
    },
    {
      id: "m3",
      displayName: "Cy",
      team: "Design",
      updatedAt: "2024-05-01T10:00:00.000Z",
      active: true,
    },
    {
      id: "m4",
      displayName: "Dee",
      team: "Design",
      updatedAt: "2024-05-04T10:00:00.000Z",
      active: true,
    },
  ];
  const snapshot = JSON.parse(JSON.stringify(members)) as TeamMember[];

  expect(buildTeamDirectory(members)).toEqual([
    { team: "Design", members: ["Cy", "Dee"] },
    { team: "Platform", members: ["Ava Stone"] },
  ]);
  expect(members).toEqual(snapshot);
});
