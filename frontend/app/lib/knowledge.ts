import { apiRequest } from "./api";

export type SourceLine = { line: number; fragmentId: string; text: string };
export type Source = {
  documentId: string;
  revisionId: string;
  title: string;
  kind: "txt" | "note";
  content: string;
  lines: SourceLine[];
  lineCount: number;
  provenance: { kind?: string };
};
export type CitationLocation = {
  kind?: string;
  lineStart?: number;
  lineEnd?: number;
  startOffset?: number;
  endOffset?: number;
};
export type Citation = {
  id: string;
  documentId: string;
  revisionId: string;
  fragmentId: string;
  title: string;
  provenance: { kind?: string };
  location: CitationLocation;
  excerpt: string;
  claimIndex: number;
  status: "current" | "replaced" | "deleted" | "inaccessible";
};
export type Claim = {
  text: string;
  label: "supported" | "inferred" | "uncertain";
  premises: string[];
  citationIds: string[];
};
export type Scope = { mode: "space" } | { mode: "documents"; documentIds: string[] };
export type UserMessage = {
  id: string;
  sequence: number;
  role: "user";
  content: string;
  scope: Scope;
  createdAt: string;
};
export type AssistantMessage = {
  id: string;
  sequence: number;
  role: "assistant";
  content: string;
  abstained: boolean;
  reason?: string;
  claims: Claim[];
  citations: Citation[];
  createdAt: string;
};
export type Message = UserMessage | AssistantMessage;
export type Conversation = {
  id: string;
  spaceId: string;
  authorId: string;
  shared: boolean;
  canContinue: boolean;
  createdAt: string;
  updatedAt: string;
};

const spacePath = (spaceId: number) => `/api/spaces/${spaceId}`;
const conversationPath = (id: string) => `/api/conversations/${id}`;
const json = (method: string, csrfToken: string, body: object, signal?: AbortSignal): RequestInit => ({
  method,
  headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
  body: JSON.stringify(body),
  signal,
});

export const listConversations = (spaceId: number, offset = 0, limit = 50, signal?: AbortSignal) =>
  apiRequest<{ conversations: Conversation[]; offset: number; limit: number; hasMore: boolean }>(`${spacePath(spaceId)}/conversations?offset=${offset}&limit=${limit}`, { signal });

export const createConversation = (spaceId: number, csrfToken: string, signal?: AbortSignal) =>
  apiRequest<{ conversation: Conversation }>(`${spacePath(spaceId)}/conversations`, json("POST", csrfToken, {}, signal));

export const readConversation = (id: string, afterSequence = 0, signal?: AbortSignal) =>
  apiRequest<{ conversation: Conversation; messages: Message[]; nextAfter: number; hasMore: boolean }>(`${conversationPath(id)}?afterSequence=${afterSequence}&limit=100`, { signal });

export const sendMessage = (id: string, csrfToken: string, question: string, scope: Scope, signal?: AbortSignal) =>
  apiRequest<{ conversation: Conversation; userMessage: UserMessage; assistantMessage: AssistantMessage }>(`${conversationPath(id)}/messages`, json("POST", csrfToken, { question, scope }, signal));

export const setConversationShared = (id: string, csrfToken: string, shared: boolean, signal?: AbortSignal) =>
  apiRequest<{ conversation: Conversation }>(`${conversationPath(id)}/${shared ? "share" : "unshare"}`, json("POST", csrfToken, {}, signal));

export const resolveCitation = (id: string, messageId: string, citationId: string, signal?: AbortSignal) =>
  apiRequest<{ citation: Citation; source?: Source }>(`${conversationPath(id)}/messages/${messageId}/citations/${citationId}`, { signal });

export const readSource = (spaceId: number, documentId: string, signal?: AbortSignal) =>
  apiRequest<{ source: Source }>(`${spacePath(spaceId)}/documents/${documentId}/source`, { signal });

export type NoteWrite = { title: string; body: string; operationKey: string };
export const createNote = (spaceId: number, csrfToken: string, note: NoteWrite, signal?: AbortSignal) =>
  apiRequest<{ note: { documentId: string; versionId: string; taskId: string; status: string } }>(`${spacePath(spaceId)}/notes`, { ...json("POST", csrfToken, note), signal });

export const updateNote = (spaceId: number, documentId: string, csrfToken: string, note: NoteWrite, signal?: AbortSignal) =>
  apiRequest<{ note: { documentId: string; versionId: string; taskId: string; status: string } }>(`${spacePath(spaceId)}/notes/${documentId}`, { ...json("PUT", csrfToken, note), signal });
