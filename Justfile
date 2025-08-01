build:
  npx tsc

test:
  npm test

release: build test
  ./scripts/release.sh
