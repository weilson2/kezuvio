# Android Milestone 0 — repository audit

Inspection date: 31 October 2026. Workspace: `D:\WORKKK\kezuvio`.

## Observed state

| Area | Evidence and implication |
| --- | --- |
| Version control | `git status --short --branch` returns “not a git repository”. No branch, diff baseline or commit history can be reported. Git executable is available. |
| Local instructions | No `AGENTS.md` found in the workspace search or the checked ancestors `D:\` and `D:\WORKKK`. |
| Web app | `apps/website` contains Next.js App Router pages, React components, six demo routes and session/action APIs. Preserve it. |
| Demo persistence | `apps/website/lib/demo/server.ts` stores sessions in a process-local Map with a one-hour TTL. This is fictional demo infrastructure, not persistent merchant storage. |
| Demo domain | `apps/website/lib/demo/engine.ts` has integer-sen examples, booking conflicts and refunds, but uses a `profit` field and selectable demo roles. Treat these as example scenarios, not Ledger Lite architecture. |
| Brand | `packages/brand/tokens.json` matches the requested indigo/purple/cyan/navy/light palette. Vector logos and licensed fonts exist. `packages/ui` is React-specific. |
| Enquiries/privacy | Contact form prepares a local brief; website privacy notice covers that preview and fictional sessions. It is not an Android privacy notice or beta signup service. |
| Tooling | Root `package.json` has npm workspace globs, build/typecheck/test scripts and web dependencies. Lockfile exists; manifest uses version ranges. No Dart manifest or Android Gradle project found. |
| CI | `.github/workflows/ci.yml` installs Node 24, builds/typechecks/tests the website and uploads Playwright results. No Flutter checks, mobile secret scan or release signing workflow exists. |
| Prior docs | `docs/discovery-and-plan.md` and delivery/verification reports cover prior website milestones. Their historical approvals do not authorize this Android implementation. |
| Discovery evidence | No Ledger Lite interview transcripts, scored merchant research or genuine beta/pilot commitments found among inspected project documents. Counts are unknown, not proof that none exist outside this workspace. |

## Reuse decisions

- Reuse brand colors, spacing principles and SVG assets after Flutter rendering/contrast checks. Preserve aspect ratios. Add only the font weights/subsets actually needed; review Chinese coverage and redistribution licenses.
- Keep the mobile package independent of npm workspaces. Do not add a JavaScript package manifest to the Flutter directory merely to make it a workspace.
- Keep the web demos available as clearly labeled concepts for later research. Do not reuse their memory store, customer samples, demo authentication or reporting labels for live merchant data.
- Add a dedicated Flutter CI workflow later; existing website jobs and scripts continue to serve their present purpose.
- Do not create empty `booking_demo`, `admin_web`, `design_system` or `domain` packages in M0/M1.

## Local checks actually performed

| Command / inspection | Actual result |
| --- | --- |
| `rg --files --hidden` with generated/dependency exclusions | Enumerated existing source, docs, assets, tests and configuration |
| `git status --short --branch` | Failed: directory is not a Git repository |
| `Get-Command flutter,dart,java,adb,node,npm,git` | Flutter, Dart and ADB not resolved on PATH; Java, Node, npm and Git resolved |
| `node --version` / `npm.cmd --version` | v24.21.0 / 11.19.0 |
| `java -version` | Temurin OpenJDK 16.0.2; do not assume compatibility with a future Android Gradle toolchain |
| Standard Android locations | `%LOCALAPPDATA%\Android\Sdk` and `C:\Program Files\Android\Android Studio` absent; custom install locations were not exhaustively searched |
| `npm.cmd run test:unit` | Passed, 9 tests, 0 failures |
| `node scripts/check-brand.mjs` | Passed: 12 vector logos, icon sizes, licensed fonts, 18 text contrast and 4 focus/control pairs |
| Documentation links and scope | All relative Markdown links in the six new documents resolve; no `apps/ledger_lite` directory created |
| Before/after SHA-256 comparison | All 184 pre-existing files in the audited set unchanged; exactly six new Markdown files. Dependency/generated/output/attachment directories were excluded. |
| Opportunity score arithmetic | Recomputed weighted totals: Ledger 68, Booking 64, Inventory 59, Restaurant 58, AI 37 |

These checks establish a limited existing baseline, not a production security audit. Website build, TypeScript, browser/API tests, network dependency audit, Docker and hosted CI were not rerun for this documentation-only change. Prior results in `docs/verification.md` remain historical. No mobile test or screenshot result is claimed.

## Toolchain preparation for a later implementation turn

These are instructions only; no SDK, account or project was installed or initialized.

1. Download a stable Windows Flutter SDK from the [official installer](https://docs.flutter.dev/install), extract to a writable development directory such as `D:\dev\flutter`, and add its `bin` directory to user PATH. Reopen PowerShell; record the exact Flutter/Dart version and revision for CI.
2. Follow [Flutter's Android setup](https://docs.flutter.dev/platform-integration/android/setup): install Android Studio, then SDK Manager → Android SDK Platform 36 and required Build Tools, Command-line Tools, Platform-Tools and Emulator. Install other components required by the selected SDK/plugins. Record exact tool versions once compatible.
3. Use Android Studio's bundled JDK for Flutter; if necessary configure `flutter config --jdk-dir "C:\Program Files\Android\Android Studio\jbr"` using the actual installation path. Do not replace the workstation's existing Java installation implicitly.
4. Run `flutter --version`, `flutter doctor -v`, and `flutter doctor --android-licenses`; review the licenses before accepting them. Resolve every Android toolchain error.
5. Create an Android emulator in Device Manager or connect a physical phone with USB debugging and authorize that computer on the phone. Run `flutter emulators` and `flutter devices`; at least one Android target must be visible.
6. Before source implementation, establish local Git history and agree on a non-public application ID. Review ignores for SDK caches, generated builds, local settings and keystores. Remote creation/push and Play account actions are separate from local setup.

Target API 36 or higher for an ordinary new Android app is consistent with the policy retrieved during this audit; choose minSdk separately after device interviews and plugin checks. Recheck the target requirement before release. [Google Play target API policy](https://support.google.com/googleplay/android-developer/answer/11926878).

## Boundaries and unresolved facts

No existing production deployment, real client, developer account type, signing key, Android device coverage or merchant demand was verified. The source's budget and pricing are hypotheses. Existing website code was read, not rewritten. Only the six new Milestone 0 Markdown files are part of this delivery.
