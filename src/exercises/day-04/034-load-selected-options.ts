export interface ApiSearchUser {
  id: string;
  name: string;
  active: boolean;
}

export interface SearchOption {
  id: string;
  label: string;
}

export async function loadSelectedOptions(
  ids: string[],
  fetchUserById: (id: string) => Promise<ApiSearchUser>,
): Promise<SearchOption[]> {
  throw new Error("Not implemented");
}
