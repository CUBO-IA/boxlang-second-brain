#!/usr/bin/env bash
set -euo pipefail

base=${KNOWLEDGE_API_URL:-http://127.0.0.1:8085/api/knowledge.bxm}
origin=${APP_ORIGIN:-http://127.0.0.1:3005}
tmp=$(mktemp -d)
trap 'rm -f "$tmp/body" "$tmp/chat-body" "$tmp/note-body"; rmdir "$tmp"' EXIT

check() {
	local expected=$1
	shift
	local status
	status=$(curl -sS -o "$tmp/body" -w '%{http_code}' "$@")
	if [[ "$status" != "$expected" ]]; then
		cat "$tmp/body" >&2
		printf 'Expected HTTP %s, received %s\n' "$expected" "$status" >&2
		exit 1
	fi
}

check 400 "$base?op=createConversation&spaceId=1" -X POST \
	-H 'Content-Type: application/json' -H "Origin: $origin" --data '{'
grep -q '"errorCategory":"invalid_input"' "$tmp/body"

check 401 "$base?op=listConversations&spaceId=1"
grep -q '"category":"permission"' "$tmp/body"

head -c 32769 /dev/zero | tr '\000' x > "$tmp/chat-body"
check 413 "$base?op=sendMessage&conversationId=00000000-0000-0000-0000-000000000000" \
	-X POST -H 'Content-Type: application/json' --data-binary "@$tmp/chat-body"
grep -q '"errorCategory":"body_too_large"' "$tmp/body"

head -c 1100001 /dev/zero | tr '\000' x > "$tmp/note-body"
check 413 "$base?op=createNote&spaceId=1" -X POST \
	-H 'Content-Type: application/json' --data-binary "@$tmp/note-body"
grep -q '"errorCategory":"body_too_large"' "$tmp/body"

printf 'OK: BoxLang knowledge HTTP safe errors; 32,768-byte chat and 1,100,000-byte note body caps.\n'
