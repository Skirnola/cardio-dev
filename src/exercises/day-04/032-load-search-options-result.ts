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

export type SearchOptionsResult =
  | {
      status: "success";
      options: SearchOption[];
    }
  | {
      status: "error";
      message: string;
    };

export async function loadSearchOptionsResult(
  fetchUsers: (query: string) => Promise<ApiSearchUser[]>,
  query: string,
): Promise<SearchOptionsResult> {
  throw new Error("Not implemented");
}
