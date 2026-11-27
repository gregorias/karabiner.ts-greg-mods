#!/bin/bash

set -euo pipefail

# The bookmark that release commits go on in Jujutsu repositories.
release_bookmark=main

# Fail before tagging and pushing if publishing would fail.
if ! npm whoami >/dev/null 2>&1; then
  echo "Not logged in to npm. Run \`npm login\` before releasing." >&2
  exit 1
fi

use_jj=false
if [ -d .jj ]; then
  use_jj=true
fi

if [ "$use_jj" == true ] && [ -n "$(jj diff --name-only)" ]; then
  echo "The working-copy commit (@) has changes. Commit or restore them before releasing." >&2
  exit 1
fi

# Ask for the version bump type using Gum
echo "Current version: $(node -p "require('./package.json').version")"
echo "Choose the version bump:"
version_type=$(gum choose "patch" "minor" "major" "custom")

if [ "$version_type" == "custom" ]; then
  version=$(gum input --placeholder "Enter the new version")
else
  version=$version_type
fi

if [ "$use_jj" == true ]; then
  # Bump the version, then commit and tag it with Jujutsu.
  npm version "$version" --no-git-tag-version
  new_version=$(node -p "require('./package.json').version")
  jj commit -m "chore(release): $new_version"
  jj tag set "v$new_version" -r @-
  jj bookmark move "$release_bookmark" --to @-

  # Push the bookmark and the tag to the git remote
  jj git push --bookmark "$release_bookmark" --tag "v$new_version"
else
  # Bump the version, create a commit, and tag it
  npm version "$version" -m "chore(release): %s"
  new_version=$(node -p "require('./package.json').version")

  # Push the commit and tags to the git remote
  git push
  git push origin "v$new_version"
fi

npm publish

echo "✅ Release published successfully!"
