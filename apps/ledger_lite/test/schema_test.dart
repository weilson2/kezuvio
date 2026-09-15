import 'package:drift/native.dart';
import 'package:drift_dev/api/migrations_native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ledger_lite/data/database/app_database.dart';
import 'generated_migrations/schema.dart';

void main() {
  test('committed v1 schema opens without losing an existing record', () async {
    final verifier = SchemaVerifier(GeneratedHelper());
    final schema = await verifier.schemaAt(1);
    schema.rawDatabase.execute("INSERT INTO entries (id, type, amount_sen, business_date, occurred_at_local, created_at, updated_at) VALUES ('11111111-1111-4111-8111-111111111111', 'income', 12345, '2026-11-02', '2026-11-02T00:00:00', 1793577600, 1793577600)");
    final db = AppDatabase(schema.newConnection());
    try {
      await verifier.migrateAndValidate(db, 1);
      expect((await db.select(db.entries).get()).single.amountSen, 12345);
    } finally { await db.close(); }
  });
  test('fresh schema validates including indexes and foreign keys', () async {
    final db = AppDatabase(NativeDatabase.memory());
    try {
      await db.readPreferences();
      await db.validateDatabaseSchema();
      final foreignKeys = await db
          .customSelect('PRAGMA foreign_keys')
          .getSingle();
      expect(foreignKeys.read<int>('foreign_keys'), 1);
      final indexes = await db
          .customSelect("SELECT name FROM sqlite_master WHERE type = 'index'")
          .get();
      expect(
        indexes.map((r) => r.read<String>('name')),
        contains('entries_date_type'),
      );
    } finally {
      await db.close();
    }
  });
}
