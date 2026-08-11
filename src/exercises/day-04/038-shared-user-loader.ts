export interface ApiSearchUser {
  id: string;
  name: string;
  active: boolean;
}

export interface SearchOption {
  id: string;
  label: string;
}

export interface SharedUserLoader {
  load(id: string): Promise<SearchOption | null>;
}

export function createSharedUserLoader(
  fetchUserById: (id: string) => Promise<ApiSearchUser>,
): SharedUserLoader {
  throw new Error("Not implemented");
}
