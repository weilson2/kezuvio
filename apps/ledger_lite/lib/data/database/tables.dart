import 'package:drift/drift.dart';

@DataClassName('CategoryRow')
class Categories extends Table {
  TextColumn get id => text()();
  TextColumn get name => text().withLength(min: 1, max: 80)();
  TextColumn get normalizedName => text()();
  TextColumn get kind => text()();
  BoolColumn get active => boolean().withDefault(const Constant(true))();
  TextColumn get defaultKey => text().nullable().unique()();
  DateTimeColumn get createdAt => dateTime()();
  @override
  Set<Column> get primaryKey => {id};
  @override
  List<Set<Column>> get uniqueKeys => [
    {normalizedName, kind},
  ];
  @override
  List<String> get customConstraints => [
    "CHECK (kind IN ('income', 'expense'))",
  ];
}

@DataClassName('EntryRow')
@TableIndex.sql(
  'CREATE INDEX entries_date_type ON entries(business_date, type)',
)
@TableIndex.sql(
  'CREATE INDEX entries_category_date ON entries(category_id, business_date)',
)
@TableIndex.sql(
  'CREATE INDEX entries_original ON entries(original_transaction_id)',
)
class Entries extends Table {
  TextColumn get id => text()();
  TextColumn get type => text()();
  IntColumn get amountSen => integer()();
  TextColumn get currency => text().withDefault(const Constant('MYR'))();
  TextColumn get businessDate => text()();
  TextColumn get occurredAtLocal => text()();
  TextColumn get timeZoneId =>
      text().withDefault(const Constant('Asia/Kuala_Lumpur'))();
  TextColumn get categoryId => text().nullable().references(Categories, #id)();
  TextColumn get note =>
      text().withLength(max: 2000).withDefault(const Constant(''))();
  TextColumn get refundDirection => text().nullable()();
  TextColumn get originalTransactionId =>
      text().nullable().references(Entries, #id)();
  TextColumn get fromLabel => text().nullable()();
  TextColumn get toLabel => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  IntColumn get revision => integer().withDefault(const Constant(0))();
  DateTimeColumn get deletedAt => dateTime().nullable()();
  @override
  Set<Column> get primaryKey => {id};
  @override
  List<String> get customConstraints => [
    "CHECK (length(id) = 36)",
    "CHECK (type IN ('income', 'expense', 'refund', 'transfer'))",
    'CHECK (amount_sen > 0 AND amount_sen <= 999999999999)',
    "CHECK (currency = 'MYR' AND time_zone_id = 'Asia/Kuala_Lumpur')",
    "CHECK (business_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND date(business_date, '+0 days') IS NOT NULL AND date(business_date, '+0 days') = business_date AND business_date >= '1900-01-01' AND business_date < '9999-01-01')",
    "CHECK (occurred_at_local = business_date || 'T00:00:00')",
    "CHECK ((type = 'refund' AND refund_direction IS NOT NULL AND refund_direction IN ('customer_out','supplier_in')) OR (type <> 'refund' AND refund_direction IS NULL AND original_transaction_id IS NULL))",
    "CHECK (type <> 'refund' OR original_transaction_id IS NOT NULL OR length(trim(note)) > 0)",
    "CHECK ((type = 'transfer' AND category_id IS NULL AND from_label IS NOT NULL AND to_label IS NOT NULL AND length(trim(from_label)) BETWEEN 1 AND 80 AND length(trim(to_label)) BETWEEN 1 AND 80 AND lower(trim(from_label)) <> lower(trim(to_label))) OR (type <> 'transfer' AND from_label IS NULL AND to_label IS NULL))",
    'CHECK (original_transaction_id IS NULL OR original_transaction_id <> id)',
    'CHECK (deleted_at IS NULL)',
  ];
}

@TableIndex.sql('CREATE INDEX attachments_entry ON attachments(transaction_id)')
class Attachments extends Table {
  TextColumn get id => text()();
  TextColumn get transactionId =>
      text().references(Entries, #id, onDelete: KeyAction.cascade)();
  TextColumn get localPath => text().unique()();
  TextColumn get mimeType => text()();
  IntColumn get sizeBytes => integer()();
  TextColumn get checksum => text()();
  @override
  Set<Column> get primaryKey => {id};
  @override
  List<String> get customConstraints => [
    "CHECK (mime_type IN ('image/jpeg','image/png','application/pdf'))",
    'CHECK (size_bytes > 0 AND size_bytes <= 10485760)',
    'CHECK (length(checksum) = 64)',
    "CHECK (local_path NOT LIKE '/%' AND instr(local_path, '..') = 0 AND instr(local_path, ':') = 0 AND instr(local_path, char(92)) = 0)",
  ];
}

class Preferences extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();
  @override
  Set<Column> get primaryKey => {key};
  @override
  List<String> get customConstraints => [
    "CHECK ((\"key\" = 'locale' AND \"value\" IN ('en','zh')) OR (\"key\" = 'onboarded' AND \"value\" IN ('true','false')))",
  ];
}
