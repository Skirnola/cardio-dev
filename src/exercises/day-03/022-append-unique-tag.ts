export type Profile = {
  readonly name: string;
  readonly tags: readonly string[];
};

export function appendUniqueTag(profile: Profile, tag: string): Profile {
  throw new Error("Not implemented");
}
