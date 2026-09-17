#!/usr/bin/env bash
set -euo pipefail

# Run from the site directory even when called from another working directory.
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if ! command -v ruby >/dev/null 2>&1; then
  echo "Ruby is required. Install Ruby 3.4 or newer, then try again." >&2
  exit 1
fi
if ! command -v bundle >/dev/null 2>&1; then
  echo "Bundler is required. Run: gem install bundler" >&2
  exit 1
fi

export BUNDLE_GEMFILE="$PWD/Gemfile"
export BUNDLE_PATH="${BUNDLE_PATH:-$PWD/vendor/bundle}"
bundle check || bundle install

# Jekyll builds before serving and rebuilds when source files change.
exec bundle exec jekyll serve --host "${JEKYLL_HOST:-127.0.0.1}" --port "${JEKYLL_PORT:-4000}" --livereload "$@"
