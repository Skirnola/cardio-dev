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

export interface AutocompleteState {
  status: "idle" | "loading" | "success" | "error";
  query: string;
  options: SearchOption[];
  errorMessage: string | null;
}

export class AutocompleteModel {
  constructor(
    private readonly fetchUsers: (
      query: string,
      signal: AbortSignal,
    ) => Promise<ApiSearchUser[]>,
  ) {}

  getState(): AutocompleteState {
    throw new Error("Not implemented");
  }

  async search(query: string): Promise<void> {
    throw new Error("Not implemented");
  }

  async retry(): Promise<void> {
    throw new Error("Not implemented");
  }
}
