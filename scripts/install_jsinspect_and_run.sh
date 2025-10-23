#!/usr/bin/env bash
set -euo pipefail

# Script to install dev dependencies (including jsinspect) and run jsinspect across the repo
# Produces: npm-install-jsinspect.txt, jsinspect-run-output.txt, jsinspect-report.json, tool-installation-record-jsinspect.txt

OUTDIR="."
echo "Recording jsinspect install/run at: $(date -u +'%Y-%m-%dT%H:%M:%SZ')" > "$OUTDIR/tool-installation-record-jsinspect.txt"
echo "cwd=$(pwd)" >> "$OUTDIR/tool-installation-record-jsinspect.txt"

echo "Installing dev dependencies (will update node_modules and package-lock.json)" | tee "$OUTDIR/npm-install-jsinspect.txt"
# Use npm install to ensure package-lock.json is updated; --no-audit and --no-fund for cleaner output
npm install --no-audit --no-fund 2>&1 | tee -a "$OUTDIR/npm-install-jsinspect.txt"

echo "Recording installed jsinspect version and path" >> "$OUTDIR/tool-installation-record-jsinspect.txt"
node -e "try{const p=require('./package.json'); console.log('package.json has jsinspect:', !!(p.devDependencies&&p.devDependencies.jsinspect));}catch(e){console.log('err',e);}" >> "$OUTDIR/tool-installation-record-jsinspect.txt" 2>&1 || true

echo "Running jsinspect (may take a while)" > "$OUTDIR/jsinspect-run-output.txt"
# Exclude node_modules by default; jsinspect supports --reporter json
# We'll try to write a JSON report and also capture human-readable output
npx jsinspect . --reporter json --exclude node_modules 2>&1 | tee -a "$OUTDIR/jsinspect-run-output.txt" > "$OUTDIR/jsinspect-report.json" || true

echo "Completed jsinspect run at: $(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> "$OUTDIR/jsinspect-run-output.txt"

echo "Artifacts written: $OUTDIR/npm-install-jsinspect.txt, $OUTDIR/jsinspect-run-output.txt, $OUTDIR/jsinspect-report.json, $OUTDIR/tool-installation-record-jsinspect.txt"

exit 0
