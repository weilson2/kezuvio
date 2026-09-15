import 'package:drift/drift.dart';

import 'tables.dart';
part 'app_database.g.dart';

@DriftDatabase(tables: [Categories, Entries, Attachments, Preferences])
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.executor);
  @override
  int get schemaVersion => 1;
  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) async {
      await transaction(() async {
        await m.createAll();
        final now = DateTime.now().toUtc();
        for (final seed in const [
          ('00000000-0000-4000-8000-000000000001', 'Sales', 'income', 'sales'),
          (
            '00000000-0000-4000-8000-000000000002',
            'Services',
            'income',
            'services',
          ),
          (
            '00000000-0000-4000-8000-000000000003',
            'Supplies',
            'expense',
            'supplies',
          ),
          (
            '00000000-0000-4000-8000-000000000004',
            'Transport',
            'expense',
            'transport',
          ),
          ('00000000-0000-4000-8000-000000000005', 'Rent', 'expense', 'rent'),
        ]) {
          await into(categories).insert(
            CategoriesCompanion.insert(
              id: seed.$1,
              name: seed.$2,
              normalizedName: seed.$2.toLowerCase(),
              kind: seed.$3,
              defaultKey: Value(seed.$4),
              createdAt: now,
            ),
          );
        }
      });
    },
    // No shipped schema precedes v1. Refuse unsupported upgrades, never erase data.
    onUpgrade: (m, from, to) async => throw StateError('unsupported_schema'),
    beforeOpen: (details) async {
      if (details.versionBefore != null &&
          details.versionBefore! > schemaVersion) {
        throw StateError('future_schema');
      }
      await customStatement('PRAGMA foreign_keys = ON');
      await customStatement('PRAGMA busy_timeout = 5000');
    },
  );

  Future<Map<String, String>> readPreferences() async => {
    for (final row in await select(preferences).get()) row.key: row.value,
  };
  Future<void> setPreference(String key, String value) => into(
    preferences,
  ).insertOnConflictUpdate(PreferencesCompanion.insert(key: key, value: value));
}
