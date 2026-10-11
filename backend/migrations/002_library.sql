CREATE TABLE documents (
    id UUID PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES spaces(id),
    current_version UUID,
    candidate_version UUID,
    deleted_at TIMESTAMPTZ,
    cleanup_pending BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, space_id)
);

CREATE TABLE document_versions (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    space_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL REFERENCES accounts(id),
    operation_key VARCHAR(100) NOT NULL,
    request_hash CHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    media_type VARCHAR(100) NOT NULL,
    provenance JSONB NOT NULL,
    byte_size BIGINT NOT NULL CHECK (byte_size BETWEEN 1 AND 50000000),
    sha256 CHAR(64) NOT NULL,
    storage_state VARCHAR(20) NOT NULL CHECK (storage_state IN ('stored', 'ready', 'failed', 'removed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id, space_id) REFERENCES documents(id, space_id),
    UNIQUE (space_id, author_id, operation_key),
    UNIQUE (id, document_id)
);

ALTER TABLE documents ADD CONSTRAINT current_document_version FOREIGN KEY (current_version, id) REFERENCES document_versions(id, document_id);
ALTER TABLE documents ADD CONSTRAINT candidate_document_version FOREIGN KEY (candidate_version, id) REFERENCES document_versions(id, document_id);

CREATE TABLE document_tasks (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    version_id UUID NOT NULL UNIQUE,
    state VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    lease_token UUID,
    lease_until TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    error_category VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (version_id, document_id) REFERENCES document_versions(id, document_id)
);

CREATE INDEX document_space ON documents(space_id) WHERE deleted_at IS NULL;
CREATE INDEX task_claim ON document_tasks(next_attempt_at) WHERE state IN ('pending', 'processing');
