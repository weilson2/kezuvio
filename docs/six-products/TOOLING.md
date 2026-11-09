# Agent roles, skills and MCP evaluation

Prepared 5 November 2026. Root `AGENTS.md` now describes project conventions. Role and skill files below are **reviewable templates**, not registered runtime integrations. This session's `.codex` and `.agents` project directories are read-only under the managed permission profile; files are staged here rather than changing protected configuration or claiming activation.

## Team and orchestration

| Role template | Responsibility | Handoff |
| --- | --- | --- |
| `tooling/agents/alex.toml` | Project management/integration | Scoped assignments, dependency order, milestone evidence and open decisions |
| `tooling/agents/sam.toml` | Software engineering | Domain/API implementation, migrations, tests and known limitations |
| `tooling/agents/mia.toml` | UI/UX | Task flows, accessible interactions and evidence from rendered screens |
| `tooling/agents/ada.toml` | QA/security | Independent reproduction, invariants, isolation/concurrency findings |
| `tooling/agents/cleo.toml` | Marketing | Honest demonstration copy and route/claim checks |
| `tooling/agents/ava.toml` | Business operations | Cost assumptions, readiness, support/reset and approval records |

Current official Codex conventions use one TOML file per custom agent with `name`, `description` and `developer_instructions`. Templates inherit the parent's model, permissions and tools. They do not override sandbox settings. Activation, when filesystem permissions permit: review existing files, copy these templates without replacing unrelated definitions into `.codex/agents/`, and verify agent discovery in a new session. [Official subagent configuration](https://learn.chatgpt.com/docs/agent-configuration/subagents).

This phase used a live Ada-style subagent for read-only code review. It did not run six agents or validate custom-agent discovery. If custom names are unavailable, Alex can pass the role instructions directly to supported subagents; if delegation is unavailable, execute the roles sequentially and record that fact. With four total slots, reserve one for integration and at most three independent workers. One writer owns each file set, dependencies are resolved before downstream work, and Alex reviews results before integration. Do not infer publication or messaging authority from a role.

## Reusable skills

- `tooling/skills/kezuvio-demo-milestone/SKILL.md`: implement an approved demo increment with product isolation and meaningful acceptance evidence.
- `tooling/skills/kezuvio-domain-review/SKILL.md`: review Cafe/commerce money and stock or accounting posting/reset invariants.

The skills are self-contained and use repository-relative context. They have no external tools, scripts, API keys or automatic side effects. To enable repository discovery later, copy the reviewed folders into `.agents/skills/` when permitted. Current Codex documentation lists that path for repository skills. [Skill discovery](https://learn.chatgpt.com/docs/build-skills). Root versus nested instructions follow the documented `AGENTS.md` hierarchy. [Project instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## MCP decisions

`codex mcp list` was inspected without printing credentials. It listed existing desktop runtime integrations; the four candidate servers below were not configured by this task. A local Playwright dependency does not mean a Playwright MCP server is installed.

| Candidate | Provenance and permissions | Decision |
| --- | --- | --- |
| OpenAI development documentation | Official read-only HTTPS server `https://developers.openai.com/mcp`; public documentation only | Optional useful addition; staged config below, no key required |
| GitHub | Official `github/github-mcp-server`; authenticated repository tools can read/change account data | Defer until an actual remote/issue/PR task needs it; start read-only with minimal repository scope; keep tokens outside repo |
| Playwright | Microsoft-owned `microsoft/playwright-mcp`; browser control can access pages and local resources | Defer: installed Playwright tests and current browser tools cover local QA; if later needed, isolated browser profile and localhost-focused work |
| Context7 | Upstash-owned `upstash/context7`; third-party docs service, not framework authors | Defer: bundled Next.js and primary docs are sufficient; verify transport/auth/package before use |

Sources: [OpenAI Docs MCP](https://developers.openai.com/learn/docs-mcp), [GitHub MCP](https://github.com/github/github-mcp-server), [Playwright MCP](https://github.com/microsoft/playwright-mcp), [Context7](https://github.com/upstash/context7).

Official repository ownership was checked; executable package signatures, exact release integrity, auth permissions and connectivity were **not** verified because no installation was performed. Before installation, compare official release/package metadata, maintainer identity and lockfile integrity, inspect required scopes and launch arguments, then smoke-test only the needed read operation. Do not run an arbitrary `npx ...@latest` server or grant broad account access merely because it appears in the brief.

The staged `tooling/config.example.toml` contains only the public documentation endpoint and a subagent concurrency cap. Merge it into an existing configuration when permitted; do not replace the user's file. It is not automatically read from this documentation directory. No GitHub/Context7/Playwright executable server has been added to it.

## Validation record

All seven TOML files parsed with Python `tomllib`; six role definitions contain the documented required fields. Both skill drafts passed limited checks for frontmatter fields, matching valid names, description bounds and unfinished placeholders. Local Markdown links resolve.

The official skill-creator `quick_validate.py` was attempted for both drafts but could not execute because the bundled Python lacks PyYAML (`ModuleNotFoundError: yaml`). Its full validation remains pending; no package was installed solely for this check. Runtime discovery/connection remains untested until activation. Structural checks do not prove behavior; domain correctness remains governed by the milestone test suite.

Exact validator invocation in PowerShell (run separately for each of `kezuvio-demo-milestone` and `kezuvio-domain-review`):

```powershell
& 'C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' 'C:\Users\PC\.codex\skills\.system\skill-creator\scripts\quick_validate.py' 'D:\WORKKK\kezuvio\docs\six-products\tooling\skills\kezuvio-demo-milestone'
```

TOML parser check, run from repository root using the same Python executable:

```python
import pathlib, tomllib
files = list(pathlib.Path('docs/six-products/tooling').rglob('*.toml'))
for path in files:
    tomllib.loads(path.read_text())
print(f'PASS: {len(files)} TOML files parse')
```

Result: 7 passed. Separate limited assertions checked 6 required-field role schemas, 2 simple skill frontmatters and local Markdown link existence. These assertions are narrower than general YAML parsing and do not replace the blocked official validator.
