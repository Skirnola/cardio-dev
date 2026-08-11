export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  updatedAt: string;
  subscribed: boolean;
};

export function mergeContactsByEmail(contacts: readonly Contact[]): Contact[] {
  throw new Error("Not implemented");
}
