export type Language = "es" | "en";

export type User = { id: number; email: string };
export type Space = { id: number; name: string; role: "admin" | "editor" | "reader" };
export type Member = { id: number; email: string; role: "admin" | "editor" | "reader" };

export type AuthResponse = { user: User; csrfToken: string };
export type SpaceListResponse = { spaces: Space[] };
export type SpaceResponse = { space: Space };
export type MemberListResponse = { members: Member[] };
