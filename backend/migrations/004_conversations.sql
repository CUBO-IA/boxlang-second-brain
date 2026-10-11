CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    space_id BIGINT NOT NULL REFERENCES spaces(id),
    author_id BIGINT NOT NULL REFERENCES accounts(id),
    shared BOOLEAN NOT NULL DEFAULT FALSE,
    state_version BIGINT NOT NULL DEFAULT 0,
    pending_token UUID,
    next_sequence BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX conversations_space_updated ON conversations(space_id, updated_at DESC, id DESC);
CREATE INDEX conversations_pending ON conversations(pending_token) WHERE pending_token IS NOT NULL;

CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sequence BIGINT NOT NULL,
    role VARCHAR(16) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (conversation_id, sequence)
);

CREATE INDEX conversation_messages_page ON conversation_messages(conversation_id, sequence);

CREATE TABLE conversation_citations (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES conversation_messages(id) ON DELETE CASCADE,
    citation_key VARCHAR(32) NOT NULL,
    claim_index INTEGER NOT NULL CHECK (claim_index >= 1),
    document_id UUID NOT NULL,
    revision_id UUID NOT NULL,
    fragment_id VARCHAR(128) NOT NULL,
    source_title TEXT NOT NULL,
    provenance JSONB NOT NULL,
    location JSONB NOT NULL,
    excerpt TEXT NOT NULL,
    UNIQUE (message_id, citation_key)
);

CREATE INDEX conversation_citations_message ON conversation_citations(message_id);
