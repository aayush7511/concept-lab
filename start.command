#!/bin/zsh
cd "${0:A:h}" || exit 1
# Finder does not always inherit a shell's Node version-manager configuration.
if ! command -v node >/dev/null 2>&1; then
  for candidate in "$HOME"/.nvm/versions/node/*/bin/node(N); do
    export PATH="${candidate:h}:$PATH"
  done
fi
if ! command -v node >/dev/null 2>&1; then
  echo 'Install Node.js 20+ from https://nodejs.org, then try again.'
  read '?Press Enter to close.'
  exit 1
fi
echo 'Open http://127.0.0.1:4318 in your browser.'
echo 'Keep this window open. Press Ctrl+C to stop Concept Lab.'
node server.mjs
if [[ $? != 0 ]]; then read '?Press Enter to close.'; fi
