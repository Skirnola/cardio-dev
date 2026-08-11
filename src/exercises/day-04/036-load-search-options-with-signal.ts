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

export async function loadSearchOptionsWithSignal(
  fetchUsers: (query: string, signal: AbortSignal) => Promise<ApiSearchUser[]>,
  query: string,
  signal: AbortSignal,
): Promise<SearchOption[]> {
  throw new Error("Not implemented");
}
