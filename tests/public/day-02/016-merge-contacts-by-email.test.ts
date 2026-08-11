import { expect, it } from "vitest";
import { mergeContactsByEmail, type Contact } from "../../../src/exercises/day-02/016-merge-contacts-by-email";

it("keeps the newest subscribed contact for each email and sorts the surviving contacts by name", () => {
  const contacts: Contact[] = [
    {
      id: "c1",
      firstName: "Ari",
      lastName: "Ng",
      email: "ari@example.com",
      updatedAt: "2024-05-01T12:00:00.000Z",
      subscribed: true,
    },
    {
      id: "c2",
      firstName: "Bea",
      lastName: "Lopez",
      email: "bea@example.com",
      updatedAt: "2024-05-02T12:00:00.000Z",
      subscribed: false,
    },
    {
      id: "c3",
      firstName: "Ari",
      lastName: "Nielsen",
      email: "ari@example.com",
      updatedAt: "2024-05-03T12:00:00.000Z",
      subscribed: true,
    },
    {
      id: "c4",
      firstName: "Cal",
      lastName: "Ng",
      email: "cal@example.com",
      updatedAt: "2024-05-03T12:00:00.000Z",
      subscribed: true,
    },
  ];
  const snapshot = JSON.parse(JSON.stringify(contacts)) as Contact[];

  expect(mergeContactsByEmail(contacts)).toEqual([
    {
      id: "c4",
      firstName: "Cal",
      lastName: "Ng",
      email: "cal@example.com",
      updatedAt: "2024-05-03T12:00:00.000Z",
      subscribed: true,
    },
    {
      id: "c3",
      firstName: "Ari",
      lastName: "Nielsen",
      email: "ari@example.com",
      updatedAt: "2024-05-03T12:00:00.000Z",
      subscribed: true,
    },
  ]);
  expect(contacts).toEqual(snapshot);
});
