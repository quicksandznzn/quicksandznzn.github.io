#!/usr/bin/env bash
set -euo pipefail
npm ci
npm test
printf 'Static site built in dist/. Publish this folder with GitHub Pages.\n'
