#!/bin/sh
set -eu

module=${1:?expected installed bx-ai module directory}
manifest="$module/box.json"
source="$module/models/memory/vector/PostgresVectorMemory.bx"

grep -Eq '^[[:space:]]*"version":[[:space:]]*"3\.5\.0\+19",[[:space:]]*$' "$manifest" || {
	echo "Expected bx-ai 3.5.0+19; refusing to patch a different release" >&2
	exit 1
}

matches=$(grep -Ec '^[[:space:]]*\.map\( target => val\( target \) \)$' "$source" || true)
[ "$matches" = 1 ] || {
	echo "Expected exactly one pinned bx-ai scientific-notation parser line" >&2
	exit 1
}

sed -i 's/\.map( target => val( target ) )/.map( target => toNumeric( target ) )/' "$source"
grep -Fq '.map( target => toNumeric( target ) )' "$source" || {
	echo "bx-ai scientific-notation parser patch did not apply" >&2
	exit 1
}
