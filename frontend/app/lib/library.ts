import { apiRequest } from "./api";

// Phase 02 library contract as the web client consumes it. BoxLang owns the
// behaviour; these shapes are the frontend's side of the agreement with the
// library backend (plan tasks 02.1–02.6) and must change together with it.

export type DocumentStatus = "pending" | "processing" | "available" | "failed" | "unsupported";
export type DocumentSource = "file" | "note" | "url" | "github";
export type LibraryErrorCategory = "permission" | "limit" | "format" | "budget" | "provider" | "conflict" | "unknown";

export type DocumentFailure = { category: LibraryErrorCategory; retryable: boolean };

export type LibraryDocument = {
  id: number;
  name: string;
  source: DocumentSource;
  format: string;
  sizeBytes: number | null;
  status: DocumentStatus;
  failure: DocumentFailure | null;
  // A replacement in flight or failed. The document's own status keeps
  // describing the last valid content until the replacement is published.
  replacement: { status: "pending" | "processing" | "failed"; failure: DocumentFailure | null } | null;
  updatedAt: string;
};

export type LibraryLimits = { maxFileBytes: number; maxDocuments: number; maxFilesPerUpload: number };

export type DocumentListResponse = {
  documents: LibraryDocument[];
  limits: LibraryLimits;
  budget: { exhausted: boolean };
};

export type UploadResult =
  | { name: string; accepted: true; document: LibraryDocument }
  | { name: string; accepted: false; category: LibraryErrorCategory };

export type UploadResponse = { results: UploadResult[] };
export type DocumentResponse = { document: LibraryDocument };

const documentsPath = (spaceId: number) => `/api/spaces/${spaceId}/documents`;

export function listDocuments(spaceId: number, signal?: AbortSignal) {
  return apiRequest<DocumentListResponse>(documentsPath(spaceId), { signal });
}

export function uploadDocuments(spaceId: number, files: File[], csrfToken: string) {
  const body = new FormData();
  for (const file of files) body.append("files", file, file.name);
  return apiRequest<UploadResponse>(documentsPath(spaceId), {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body,
  });
}

export function replaceDocument(spaceId: number, documentId: number, file: File, csrfToken: string) {
  const body = new FormData();
  body.append("file", file, file.name);
  return apiRequest<DocumentResponse>(`${documentsPath(spaceId)}/${documentId}/content`, {
    method: "PUT",
    headers: { "x-csrf-token": csrfToken },
    body,
  });
}

export function retryDocument(spaceId: number, documentId: number, csrfToken: string) {
  return apiRequest<DocumentResponse>(`${documentsPath(spaceId)}/${documentId}/retry`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
    body: "{}",
  });
}

export function deleteDocument(spaceId: number, documentId: number, csrfToken: string) {
  return apiRequest<{ message: string }>(`${documentsPath(spaceId)}/${documentId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
    body: "{}",
  });
}

export function originalDocumentPath(spaceId: number, documentId: number) {
  return `${documentsPath(spaceId)}/${documentId}/original`;
}
