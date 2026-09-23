#!/usr/bin/env bash
set -euo pipefail

workspace_root="$(jj workspace root 2>/dev/null || pwd)"
cd "$workspace_root"

# Use Lefthook with --colors=on to preserve ANSI coloring.
jj run --ignore-changes -r "(remote_bookmarks()..@-) ~ root()" -- lefthook run --colors=on pre-commit
jj run --ignore-changes -r "(remote_bookmarks()..@-) ~ root()" -- just --justfile "$workspace_root/Justfile" lint-commit-msg
