-- Role B: AI budget ledger and knowledge-core fragment storage.
-- Provisional rates/limits follow phase 00 local defaults. Phase 00 remains Bloqueada.

CREATE TABLE budget_days (
    day_utc DATE PRIMARY KEY,
    limit_usd NUMERIC(14, 8) NOT NULL CHECK (limit_usd > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_reservations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    day_utc DATE NOT NULL REFERENCES budget_days(day_utc),
    operation VARCHAR(32) NOT NULL CHECK (operation IN ('embed', 'chat', 'concepts', 'retry')),
    model VARCHAR(128) NOT NULL,
    estimated_usd NUMERIC(14, 8) NOT NULL CHECK (estimated_usd >= 0),
    reserved_usd NUMERIC(14, 8) NOT NULL CHECK (reserved_usd >= 0),
    prompt_tokens INTEGER CHECK (prompt_tokens IS NULL OR prompt_tokens >= 0),
    completion_tokens INTEGER CHECK (completion_tokens IS NULL OR completion_tokens >= 0),
    total_tokens INTEGER CHECK (total_tokens IS NULL OR total_tokens >= 0),
    actual_usd NUMERIC(14, 8) CHECK (actual_usd IS NULL OR actual_usd >= 0),
    status VARCHAR(32) NOT NULL CHECK (status IN ('reserved', 'settled', 'released', 'unknown_retained')),
    result VARCHAR(32) NOT NULL CHECK (result IN ('open', 'success', 'denied', 'timeout', 'error', 'unknown', 'released')),
    error_safe VARCHAR(240),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMPTZ
);

CREATE INDEX budget_reservations_day_status ON budget_reservations(day_utc, status);
CREATE INDEX budget_reservations_open_created ON budget_reservations(created_at) WHERE status = 'reserved';

CREATE TABLE knowledge_documents (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    revision_id VARCHAR(64) NOT NULL,
    name VARCHAR(240) NOT NULL,
    media_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('staging', 'indexed', 'replaced', 'deleted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX knowledge_documents_space ON knowledge_documents(space_id, status);

CREATE TABLE knowledge_fragments (
    id VARCHAR(64) PRIMARY KEY,
    space_id VARCHAR(64) NOT NULL,
    document_id VARCHAR(64) NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    revision_id VARCHAR(64) NOT NULL,
    fragment_index INTEGER NOT NULL CHECK (fragment_index >= 1),
    text TEXT NOT NULL,
    location JSONB NOT NULL,
    embedding vector(1536),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (document_id, revision_id, fragment_index)
);

CREATE INDEX knowledge_fragments_auth ON knowledge_fragments(space_id, document_id) WHERE published = TRUE;
