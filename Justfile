build:
  npx tsc

test:
  npm test

publish: build test
  npm publish
