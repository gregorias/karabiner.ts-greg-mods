# List available recipes
default:
    @just --list

# Install NPM dependencies from the lock file.
install-package-lock:
    npm install

alias npm-install-package-lock := install-package-lock

# Run all checks
check:
    @lefthook run pre-commit

# Run all formatters
format:
    @lefthook run format

# Build TypeScript
build:
    npx tsc

# Run tests
test:
    npm test

# Format JavaScript and TypeScript files
format-js:
    fd -e js -e jsx -e mjs -e ts -e tsx -e mts -E dist -E node_modules -X prettier -w

# Check JavaScript and TypeScript files formatting
check-js:
    fd -e js -e jsx -e mjs -e ts -e tsx -e mts -E dist -E node_modules -X prettier -c

# Format JSON files
format-json:
    fd -e json -E node_modules -X prettier -w

# Check JSON files formatting
check-json:
    fd -e json -E node_modules -X prettier -c

# Format YAML files
format-yaml:
    fd -e yml -e yaml -X prettier -w

# Check YAML files formatting
check-yaml:
    fd -e yml -e yaml -X prettier -c

# Lint JavaScript and TypeScript files
lint-js:
    npm run lint -- --max-warnings=0

# Lint Markdown files
lint-markdown:
    fd -e md -X markdownlint

# Release package
release: build test
    ./scripts/release.sh

alias validate-json := check-json
