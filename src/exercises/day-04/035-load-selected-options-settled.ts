export interface ApiSearchUser {
  id: string;
  name: string;
  active: boolean;
}

export interface SearchOption {
  id: string;
  label: string;
}

export interface LoadSelectedOptionsSettledResult {
  options: SearchOption[];
  failedIds: string[];
}

export async function loadSelectedOptionsSettled(
  ids: string[],
  fetchUserById: (id: string) => Promise<ApiSearchUser>,
): Promise<LoadSelectedOptionsSettledResult> {
  throw new Error("Not implemented");
}
