import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Export current source without touching the working checkout or its Git history.
const repository = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(repository, "outputs/github-upload/kezuvio-labs");
try {
  await mkdir(destination, { recursive: false });
} catch (error) {
  if (error.code === "EEXIST") throw new Error(`Export already exists: ${destination}`);
  if (error.code !== "ENOENT") throw error;
  await mkdir(dirname(destination), { recursive: true });
  await mkdir(destination);
}
const excludedDirectories = new Set([
  "node_modules", ".git", ".next", ".local", ".codex", ".agents", ".idea",
  ".dart_tool", ".gradle", ".kotlin", ".cxx", ".pub-cache", ".pub",
  "build", "dist", "coverage", "test", "tests", "integration_test",
  "test-results", "playwright-report", "captures",
]);
const excludedFile = (name) =>
  name === "AGENTS.md" || name === "local.properties" || name === "key.properties" ||
  name === "GeneratedPluginRegistrant.java" || name === ".flutter-plugins-dependencies" ||
  name.startsWith(".env") || /\.(?:iml|jks|keystore|pem|key|log|tsbuildinfo|apk|aab|class)$/.test(name) ||
  /\.(?:test|spec)\.[^.]+$/.test(name);

async function copy(source, target) {
  const info = await stat(source);
  if (info.isDirectory()) {
    await mkdir(target, { recursive: true });
    for (const entry of await readdir(source, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error(`Unexpected source symlink: ${join(source, entry.name)}`);
      if (entry.isDirectory() ? excludedDirectories.has(entry.name) : excludedFile(entry.name)) continue;
      await copy(join(source, entry.name), join(target, entry.name));
    }
  } else {
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
  }
}
for (const item of [
  "apps/website", "apps/ledger_lite", "packages",
  "assets/logos", "assets/icons", "assets/fonts",
  "package-lock.json", "prisma.config.ts",
  "scripts/generate-brand.mjs", "scripts/labs-db.mjs",
  "scripts/operations-setup.mjs", "scripts/check-brand.mjs",
]) await copy(join(repository, item), join(destination, item));
await copyFile(join(repository, ".env.example"), join(destination, ".env.example"));

const manifest = JSON.parse(await readFile(join(repository, "package.json"), "utf8"));
const retainedScripts = new Set(["dev", "build", "start", "typecheck", "brand:generate", "db:generate", "db:migrate", "operations:setup"]);
manifest.scripts = Object.fromEntries(Object.entries(manifest.scripts).filter(([name]) => retainedScripts.has(name)));
await writeFile(join(destination, "package.json"), JSON.stringify(manifest, null, 2) + "\n");

const androidIgnore = join(destination, "apps/ledger_lite/android/.gitignore");
await writeFile(androidIgnore, (await readFile(androidIgnore, "utf8")).split(/\r?\n/)
  .filter((line) => !["gradle-wrapper.jar", "/gradlew", "/gradlew.bat"].includes(line)).join("\n"));
await writeFile(join(destination, ".gitignore"), `node_modules/
.next/
.env
.env.*
!.env.example
/.local/
tmp/
outputs/
output/
dist/
*.tsbuildinfo
.dart_tool/
.gradle/
.kotlin/
.idea/
**/build/
**/android/local.properties
**/android/key.properties
*.jks
*.keystore
*.iml
.DS_Store
Thumbs.db
`);

await writeFile(join(destination, "README.md"), `# Kezuvio Labs

Source-only GitHub package: the studio website, six shared web products, five legacy web demos, and the independent Ledger Lite Flutter application.

## Included projects

| Project | Source |
| --- | --- |
| Studio website | apps/website |
| Cafe POS and QR Ordering | packages/cafe; /demo/cafe-pos |
| Commerce Studio | packages/commerce; /demo/commerce-studio |
| AI Automation Hub | packages/automation; /demo/automation-hub |
| Property CRM | packages/property; /demo/property-crm |
| Accounting Cloud | packages/accounting; /demo/accounting-cloud |
| Interior 3D Studio | packages/interior; /demo/interior-3d |
| Ledger Lite | apps/ledger_lite |

The web products run in one Next.js application and depend on the shared packages. Upload this entire folder as one repository. Ledger Lite has its own Flutter toolchain and does not use the web database.

## Website

Use Node.js 24 and npm. From this repository root:

~~~sh
npm ci
npm run build
npm run start
~~~

Open http://127.0.0.1:3000 or /demo. For development use npm run dev. Copy .env.example to apps/website/.env.local for optional contact links, canonical URL and origin settings. Dependency installation, Prisma generation and brand generation are required; node_modules and generated builds are intentionally excluded.

## Database for the six web products

Use PostgreSQL 18. Provision a new local database and two separate login roles: a migration owner and a restricted runtime role. Both roles must use NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS. The migration role owns the database; grant CONNECT to both roles and revoke database access from PUBLIC. Do not run the web application as the owner or a superuser: workspace isolation depends on the restricted runtime role.

Create the ignored file .local/postgresql/.env.dev with your own values (replace every placeholder; URL-encode passwords):

~~~dotenv
DATABASE_URL=postgresql://labs_dev_runtime:YOUR_RUNTIME_PASSWORD@127.0.0.1:5432/kezuvio_labs_dev
MIGRATION_DATABASE_URL=postgresql://labs_dev_owner:YOUR_OWNER_PASSWORD@127.0.0.1:5432/kezuvio_labs_dev
DATABASE_RUNTIME_ROLE=labs_dev_runtime
LABS_ORIGIN=http://127.0.0.1:3000
~~~

Create a second ignored file .local/postgresql/.env.dev.runtime containing only DATABASE_URL and LABS_ORIGIN with the same values. Then run npm run db:migrate from the repository root. It applies the included migration history and grants the runtime role access. Run npm run build again and start the website. Alternatively supply environment variables directly to each relevant process. The website can build without a live database; the six persisted demos need a configured database to operate.

Keep both environment files private. No existing databases, credentials or user data are supplied. The data shown in demos is fictional, and payments are simulated. These applications do not claim financial, tax or regulatory compliance.

## Ledger Lite Android

Use Flutter 3.47.5 (see .flutter-version), a compatible Android SDK with API 36, and a compatible Java toolchain. From apps/ledger_lite:

~~~sh
flutter pub get
flutter gen-l10n
flutter run --flavor dev
~~~

To create a development APK use flutter build apk --debug --flavor dev. Release builds are deliberately blocked by the current Android project until release signing is implemented. Gradle wrappers, generated Dart source, localization source, lockfiles and font licenses are included. Machine-specific Android paths and signing keys are excluded.

## Source package scope

Tests, integration tests, Playwright configuration, test reports, historical delivery documents, agent settings, local toolchains, caches, builds, Git history and private environment files are excluded. Build dependencies and their original lockfiles are retained for reproducibility. Test npm scripts and test-based CI workflows are omitted.

The optional private /operations desk source is retained. Its brand utility is included because the desk uses it to locate the repository. Unit and studio verification actions require the omitted test suites and are unavailable in this source package; use the full development checkout for those actions. No private desk configuration is supplied.

For GitHub, upload the contents of this folder, including .gitignore and .env.example. With Git, run git init, git add ., and git commit locally, then connect your chosen GitHub repository. Review the files before publishing. This package has not been pushed or deployed.
`);
await writeFile(join(destination, "apps/ledger_lite/README.md"), `# Ledger Lite

Independent Flutter cash-flow development app. Use Flutter 3.47.5. From this folder run flutter pub get, flutter gen-l10n, then flutter run --flavor dev.

Development APK: flutter build apk --debug --flavor dev. Release signing is not configured and release builds are blocked. See the root README for source-package scope. Tests, local databases, SDKs and signing keys are not included.
`);

console.log(`Prepared source package: ${destination}`);
console.log("Tests, private configuration, build output, and Git history excluded.");
