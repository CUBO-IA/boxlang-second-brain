ALTER TABLE conversations ADD COLUMN pending_expires_at TIMESTAMPTZ;
-- Invalidate pre-lease turns and bump their fence so old workers cannot publish after upgrade.
UPDATE conversations SET pending_token = NULL, state_version = state_version + 1 WHERE pending_token IS NOT NULL;
ALTER TABLE conversations ADD CONSTRAINT conversation_pending_lease_pair CHECK ((pending_token IS NULL) = (pending_expires_at IS NULL));
CREATE INDEX conversations_expired_pending ON conversations(pending_expires_at) WHERE pending_token IS NOT NULL;
