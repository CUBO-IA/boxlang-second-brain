import { ApiError, apiRequest } from "./api";

// Phase 02 library contract as the web client consumes it. BoxLang owns the
// behaviour; these shapes are the frontend's side of the agreement with the
// library backend (plan tasks 02.1–02.6) and must change together with it.

export type DocumentStatus = "pending" | "processing" | "available" | "failed" | "unsupported";
export type DocumentSource = "file" | "note" | "url" | "github";
export type LibraryErrorCategory = "permission" | "limit" | "format" | "budget" | "provider" | "conflict" | "unknown";

export type DocumentFailure = { category: LibraryErrorCategory; retryable: boolean };

export type LibraryDocument = {
  id: string;
  attempt: { taskId: string };
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
  | { name: string; accepted: true; document: { status: DocumentStatus } }
  | { name: string; accepted: false; category: LibraryErrorCategory };

export type UploadResponse = { results: UploadResult[] };
const documentsPath = (spaceId: number) => `/api/spaces/${spaceId}/documents`;

export function listDocuments(spaceId: number, signal?: AbortSignal) {
  return apiRequest<DocumentListResponse>(documentsPath(spaceId), { signal });
}

function uploadBody(files: File[]) {
  const body = new FormData();
  body.set("count", String(files.length));
  files.forEach((file, index) => {
    body.set(`file${index + 1}`, file, file.name);
    body.set(`name${index + 1}`, file.name);
    body.set(`key${index + 1}`, crypto.randomUUID());
  });
  return body;
}

type StoredUploadResponse = { results: { status: number; document?: { status: DocumentStatus }; error?: { category: LibraryErrorCategory } }[] };

export async function uploadDocuments(spaceId: number, files: File[], csrfToken: string): Promise<UploadResponse> {
  const response = await apiRequest<StoredUploadResponse>(documentsPath(spaceId), {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: uploadBody(files),
  });
  return { results: response.results.map((result, index): UploadResult => result.document
    ? { name: files[index].name, accepted: true, document: result.document }
    : { name: files[index].name, accepted: false, category: result.error?.category ?? "unknown" }) };
}

export async function replaceDocument(spaceId: number, documentId: string, file: File, csrfToken: string) {
  const response = await apiRequest<StoredUploadResponse>(`${documentsPath(spaceId)}/${documentId}/content`, {
    method: "POST",
    headers: { "x-csrf-token": csrfToken },
    body: uploadBody([file]),
  });
  const result = response.results[0];
  if (!result.document) throw new ApiError(result.status, "No se pudo reemplazar el documento.", result.error?.category ?? "unknown");
  return result.document;
}

export function retryDocument(spaceId: number, taskId: string, csrfToken: string) {
  return apiRequest(`/api/spaces/${spaceId}/tasks/${taskId}/retry`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
    body: "{}",
  });
}

export function deleteDocument(spaceId: number, documentId: string, csrfToken: string) {
  return apiRequest<{ status: "deleted" | "deleting" }>(`${documentsPath(spaceId)}/${documentId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
    body: "{}",
  });
}

export function originalDocumentPath(spaceId: number, documentId: string) {
  return `${documentsPath(spaceId)}/${documentId}/original`;
}
