import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
const names = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const rules = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ["GitHub fine-grained token", /\bgithub_pat_[A-Za-z0-9_]{60,}\b/],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["Stripe live secret", /\bsk_live_[A-Za-z0-9]{20,}\b/],
  ["OpenAI credential", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{40,}\b/],
];
let scanned = 0,
  findings = 0;
for (const name of names) {
  if (
    !/\.(?:[cm]?[jt]sx?|json|md|ya?ml|toml|ps1|dart|sql|env|pem|key)$/.test(
      name,
    ) ||
    statSync(name).size > 2000000
  )
    continue;
  scanned++;
  const lines = readFileSync(name, "utf8").split(/\r?\n/);
  for (const [index, line] of lines.entries())
    for (const [label, pattern] of rules)
      if (pattern.test(line)) {
        console.error(
          `${name}:${index + 1}: possible ${label}; value withheld`,
        );
        findings++;
      }
}
console.log(
  `Scanned ${scanned} intended source files for ${rules.length} credential patterns; ${findings} findings. Ignored private files and binary artifacts are excluded; this is a bounded check, not proof of no secrets.`,
);
if (findings) process.exitCode = 1;
