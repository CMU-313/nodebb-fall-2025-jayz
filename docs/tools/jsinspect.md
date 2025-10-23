# jsinspect: duplicate code detection

This document explains what I added and the artifacts produced when running jsinspect on this repository.

Files added by this change:

- `scripts/install_jsinspect_and_run.sh` — installs devDependencies (so package-lock.json will record the install) and runs `jsinspect` across the repo. Produces artifact files described below.
- `package.json` — updated devDependencies to include `jsinspect` so installation is tracked in package.json and package-lock.json.

Artifacts produced by running the script (and committed with this change):

- `npm-install-jsinspect.txt` — capture of `npm install` output.
- `jsinspect-run-output.txt` — human-readable output from the jsinspect run (stdout/stderr).
- `jsinspect-report.json` — JSON reporter output from jsinspect (if produced).
- `tool-installation-record-jsinspect.txt` — timestamp and basic verification that `jsinspect` is present in package.json.devDependencies.

How to reproduce locally (recommended inside the devcontainer):

```
chmod +x ./scripts/install_jsinspect_and_run.sh
./scripts/install_jsinspect_and_run.sh
```

Notes:
- This intentionally does not commit a node_modules directory. The devDependency addition in `package.json` plus an updated `package-lock.json` (committed) serve as tracked evidence of the install.
- I excluded `node_modules` from the jsinspect scan in the script to keep the scan focused on repository source.
