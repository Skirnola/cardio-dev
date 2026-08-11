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

export interface SearchRequestState {
  status: "loading" | "success" | "error";
  query: string;
  options: SearchOption[];
  errorMessage: string | null;
}

export async function runSearchRequest(
  fetchUsers: (query: string) => Promise<ApiSearchUser[]>,
  query: string,
  onStateChange: (state: SearchRequestState) => void,
): Promise<void> {
  throw new Error("Not implemented");
}
