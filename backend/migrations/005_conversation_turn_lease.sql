ALTER TABLE conversations ADD COLUMN pending_expires_at TIMESTAMPTZ;
ALTER TABLE conversations ADD CONSTRAINT conversation_pending_lease_pair CHECK ((pending_token IS NULL) = (pending_expires_at IS NULL));
CREATE INDEX conversations_expired_pending ON conversations(pending_expires_at) WHERE pending_token IS NOT NULL;
