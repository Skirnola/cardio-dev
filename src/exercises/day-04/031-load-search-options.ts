export interface ApiSearchUser {
  id: string;
  name: string;
  active: boolean;
  aliases?: string[];
}

export interface SearchOption {
  id: string;
  label: string;
}

export async function loadSearchOptions(
  fetchUsers: (query: string) => Promise<ApiSearchUser[]>,
  query: string,
): Promise<SearchOption[]> {
  throw new Error("Not implemented");
}
