#!/bin/bash

set -euo pipefail

# Ask for the version bump type using Gum
echo "Current version: $(node -p "require('./package.json').version")"
echo "Choose the version bump:"
version_type=$(gum choose "patch" "minor" "major" "custom")

if [ "$version_type" == "custom" ]; then
  version=$(gum input --placeholder "Enter the new version")
else
  version=$version_type
fi
# Bump the version, create a commit, and tag it
npm version "$version" -m "chore(release): %s"

new_version=$(node -p "require('./package.json').version")

# Push the commit and tags to the git remote
git push
npm publish

echo "✅ Release published successfully!"
