# Install NPM dependencies from the lock file.
install-package-lock:
    npm install

alias npm-install-package-lock := install-package-lock

build:
  npx tsc

test:
  npm test

release: build test
  ./scripts/release.sh
