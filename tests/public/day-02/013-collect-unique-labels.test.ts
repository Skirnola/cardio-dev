import { expect, it } from "vitest";
import { collectUniqueLabels } from "../../../src/exercises/day-02/013-collect-unique-labels";

it("trims labels, removes duplicates, and keeps the first seen order without mutating the input", () => {
  const labels = ["  bug", "ui", "", "bug", "  ui ", "docs"];
  const snapshot = JSON.parse(JSON.stringify(labels)) as string[];

  const result = collectUniqueLabels(labels);

  expect(result instanceof Set).toBe(true);
  expect([...result]).toEqual(["bug", "ui", "docs"]);
  expect(labels).toEqual(snapshot);
});
