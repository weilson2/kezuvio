# Ledger Lite — proposed data and privacy contract

31 October 2026. Design only; no database or application exists yet. Amounts below are synthetic examples. This is a cash-recording product design, not tax/accounting advice or a compliance claim.

## Entity model

| Entity | Fields / constraints |
| --- | --- |
| Transaction | UUID `id`; `type` = income/expense/transfer/refund; positive int64 `amountSen`; `currency` = MYR; `occurredAtLocal` ISO local date/time; `businessDate` YYYY-MM-DD derived from it; `timeZoneId` fixed to Asia/Kuala_Lumpur in v1; nullable category FK; note; UTC created/updated timestamps; nullable `deletedAt` reserved, always null in v1 |
| Refund extension | On refund rows only: `refundDirection` = customer_out/supplier_in; nullable `originalTransactionId` FK to income/expense respectively. Unlinked refunds require explicit direction and an explanation. Other types must not carry refund fields. |
| Transfer extension | On transfers only: required distinct short `fromLabel` and `toLabel`, describing two business-owned cash locations. No account balances, loan principal, owner capital or personal drawings accounting in v1. |
| Category | UUID id; merchant display name; kind income/expense; active boolean; nullable immutable default-category key; UTC createdAt. Validate unique trimmed/case-normalized names per kind; archive referenced categories. |
| Attachment | UUID id; transaction FK; private relative file path (not external URI); MIME allowlist; byte size; SHA-256 checksum. Foreign key enabled; paths must stay inside the active data generation. |
| Preferences | Language en/zh-Hans; onboarding completion; fixed currency/time policy. Use typed settings; no account or credentials. |
| BackupMetadata | formatVersion, schemaVersion, createdAt UTC, appVersion, currency/time policy, record counts, payload checksum and per-file path/size/checksum manifest. Separate backup format version from DB schema version. |

Database checks enforce amount range, currency, valid type combinations and referential integrity. Application rules additionally enforce valid calendar dates, category-kind matching and linked-refund totals inside the same database transaction. Index active records by business date/type and category/date; index refund references and attachment transaction IDs. All mutations update their timestamps atomically.

Schema v1 includes these entity definitions; M1 exposes transaction CRUD with seeded categories, while M2 provides category management, attachment and backup interfaces. Reject unsupported or malformed fields rather than silently interpreting them.

## Money, refund and reporting rules

- Parse decimal text using integer/string arithmetic; accept up to two decimal places. `18.50` means 1,850 sen. Reject zero/negative entries, exponent notation, NaN, ambiguous separators and excess precision with localized errors; do not silently round user input. Provisional maximum entry: 999,999,999,999 sen. Review the cap with actual business needs.
- Store positive magnitudes and derive direction from type. Never persist floating-point currency. Use checked exact aggregate arithmetic and handle overflow explicitly; do not rely on overflowing SQLite integer sums or convert totals to floating point.
- A customer refund is money returned to a customer and reduces net income; a supplier refund is money received back and reduces net expenses. A linked refund must match the original kind and cannot cumulatively exceed its original amount. Refund date cannot precede the linked original's business date. Unlinked historical refunds remain explicitly labeled and cannot be represented as verified against an original.
- Linked refunds inherit the original category. Reject original amount/type/date/category edits that would invalidate existing refunds. Offer to resolve dependents first; never silently rewrite historical refund classification. Deletion of an original with refunds is blocked until those refund rows are explicitly resolved/deleted.
- Transfers represent movement between business-owned locations, contribute zero to business inflows/outflows and show separately. Do not treat customer receipts, purchases or owner drawings as internal transfers. No account-balance reconciliation is promised.

For non-deleted rows in a date range, let I = income, E = expense, CR = customer refunds and SR = supplier refunds (each a sum of positive sen):

| Metric | Formula / label |
| --- | --- |
| Gross recorded income | I |
| Net income received | I − CR |
| Net expense paid | E − SR |
| Total inflows | I + SR |
| Total outflows | E + CR |
| Net cash flow | (I + SR) − (E + CR) = (I − CR) − (E − SR) |
| Internal transfers | Separate sum/list; excluded from the above |

Dashboard primary cards: **Inflows, Outflows, Net cash flow**. Show net income/expense and refunds explicitly in report detail, so a supplier refund is not mislabeled sales revenue. Do not use “profit”, “tax report” or “LHDN compliant”. Date/category filters apply to the refund's own occurrence date and its assigned category, not to the original's reporting period. A range can legitimately have negative net income/expense.

Example: income 10,000 sen, expense 3,000, customer refund 2,000, supplier refund 500, and internal transfer 4,000 → inflows 10,500, outflows 5,000, net cash flow 5,500, net income 8,000 and net expenses 2,500. Removing the transfer must not change net cash flow. A refund next month affects next month's cash flow.

## Dates and category lifecycle

Use the fixed Asia/Kuala_Lumpur business timezone for v1 and retain the entered local wall time. When only a date is entered, store local midnight and label the UI as date-only; do not pretend an exact transaction time was captured. Keep created/updated instants in UTC. Device timezone changes must not shift business dates or historical report totals.

Date ranges use start inclusive / day-after-end exclusive comparisons on `businessDate`. Test month/year/leap-day boundaries and UTC/local boundary cases. Validate `businessDate` agrees with `occurredAtLocal`. Multi-timezone reporting is deferred.

Use stable keys for localized seeded categories; merchant-written category names are never auto-translated. Referenced categories are archived, not destroyed; existing entries retain labels. Archive hides a category from new-entry choices, while an unchanged existing entry can retain it. Deleting an unused category is allowed. Category reassignment is explicit and transactional. Transfers have no income/expense category; uncategorized income/expense is allowed.

## Receipts and deletion

M2 copies user-selected images/PDFs into app-private storage; do not rely on lasting access to a picker URI. Provisional limits: JPEG/PNG/PDF, 10 MiB per attachment, five attachments per entry. Verify actual file content, dimensions/decode limits and size; use generated filenames and no traversal or symlinks. Image processing should remove unnecessary location metadata and its behavior must be tested. PDF rendering and any retained metadata need explicit review.

Stage and validate a file before committing its DB reference; track interrupted work and reconcile orphan files on startup. Keep a failed copy from creating a broken attachment record. Permission denial, cancellation, disk-full and process-kill paths must leave existing data intact.

Deleting a transaction is an explicit permanent action in v1: hard-delete its row and attachment references transactionally, then retry file cleanup through a durable cleanup queue/journal. Reserved `deletedAt` does not imply hidden retention or a trash feature. Avoid promising physical forensic erasure on flash storage. `Delete all data` must remove active and inactive generations, recovery copies, temporary files and local preferences; restart into onboarding. Persist only enough temporary deletion state to finish cleanup after process death, then remove it. Prior exported files and the original picker source remain user-controlled and are not deleted by the app.

## Backup and restore protocol (Milestone 2)

Backup contents: versioned UTF-8 logical data plus attachment files in a container and a manifest. Keep exact large integers as decimal strings in JSON and export only relative file paths. Checksums detect accidental corruption; they do not prove authenticity or provide encryption. Proposed v1 exports are unencrypted and must disclose that before save. If research shows encryption is essential, revise the scope/design before beta rather than inventing cryptography.

1. Serialize writes through a coordinator, take a consistent database snapshot and capture the associated immutable receipt set. Export from that snapshot; report free-space/copy failures without losing source data.
2. Write the complete container in app-private temporary storage, verify it, then save to the user's chosen destination. Cancellation or a partial destination write is not success. Clean temporary exports after completion/cancel and again on startup after interruption.
3. For restore, inspect the manifest without changing live data. Reject unsupported future format/schema, wrong currency/time policy, invalid references/amounts, duplicate IDs, missing receipts, checksum failures, absolute/traversal paths, links and archive expansion abuse. Define/test archive byte/count/expansion limits in M2 before accepting imports. Import files are untrusted even if they say “Kezuvio”.
4. Build a new private generation containing the restored DB and receipt directory; migrate supported older versions there, check FK integrity, counts and totals, and show a preview. Refuse unsupported older versions with an explanation. Keep the original live dataset unchanged on all validation failures.
5. **Replace only:** show that current records will be replaced and offer a separate safety export. Require explicit confirmation. No auto-merge, additive restore or duplicate-by-ID behavior. A repeated restore yields the backup's same dataset and totals.
6. Pause writes and close readers, flush staged data, then journal and atomically replace a small active-generation pointer. Validate/open the new generation before declaring success. At startup, the journal identifies whether to finish activation or roll back; never mix an old database with new receipt paths. Prove the chosen filesystem operations on supported Android devices.
7. Retain the prior private generation only until the new generation has opened and passed integrity checks, then delete it. Startup resumes pending cleanup. A failed activation reopens the original. User-created external safety backups are retained until the user removes them; the app does not silently accumulate private snapshots.

Tests must cover process kill before/after each journal/pointer step, corrupted/truncated backups, older-schema restore, disk full, repeated restore, canceled confirmation, dangling files and delete-all during recovery. CSV is an interchange report, not a complete backup or a restore format.

## CSV contract

M2 exports UTF-8 with stable column names: id, type, business_date, amount_sen, amount_myr, currency, category, note, refund_direction, original_transaction_id, transfer_from, transfer_to. Format amount_myr exactly from sen with a dot decimal separator; quote delimiters, quotes and newlines. Use a documented spreadsheet-safe escaping rule for formula-like user text (`=`, `+`, `-`, `@` and leading control whitespace); verify in target spreadsheet apps. Explain any text prefix in export documentation. Include neither private attachment paths nor embedded receipts. CSV import with preview remains SHOULD/later, distinct from manual backup restore.

## Privacy/data map

| Data | Purpose / location | Outbound path | Retention / deletion |
| --- | --- | --- | --- |
| Amounts, dates, categories, notes | Cash records; private SQLite | Only user export/backup | Until individual deletion or clear-data; notes may contain personal information |
| Receipt files | Evidence attached to entries; private files | Manual backup; deliberate user sharing if later offered | With record deletion plus retried cleanup; no receipts in logs |
| Locale/onboarding | Local preferences | None planned | Clear-data resets |
| Recovery/temp files | Safe backup/import/deletion | User-chosen export only | Cleanup after success/cancel or next recovery startup |
| Exported CSV/backups | User portability; chosen provider | May reach cloud through chosen document provider | Outside app control; disclose before export |
| Error diagnostics | Sanitized error codes, no values/notes/paths | None automatically | Bounded local diagnostic lifecycle to define/test; opt-in support sharing only if later built |
| Research/beta contact | Recruitment and feedback; separate private register | Only consented follow-up channels | Research retention rules in validation plan; never ship with app |

No app account, device advertising ID, contact list, location or bank credentials are needed. Android picker/camera mechanisms may involve system apps; choose the integration with the least required permissions and verify behavior. Do not request broad storage permissions without a demonstrated need. Future auth secrets belong in platform-backed secure storage, never source or ordinary preferences.

Proposed platform policy: exclude financial DB, receipts, private backups and diagnostics from cloud backup and device transfers using appropriate old/new Android rules, then verify. Android's documentation warns that `allowBackup=false` alone may not prevent device-to-device transfer on some manufacturers. [Android backup behavior](https://developer.android.com/identity/data/autobackup).

Privacy notice outline: operator/support details; local data and receipt contents; permissions; user exports/providers; backups and loss limits; retention/deletion; optional diagnostics if added; changes and contact. Fill Play Data safety from the shipped manifest, SDKs and observed traffic in M3. Do not pre-answer “no data collected” based only on this design. Malaysian registration, tax and privacy obligations need a separate current authority/adviser review before operation; none are certified here.
