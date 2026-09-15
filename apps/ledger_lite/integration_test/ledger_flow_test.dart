import 'dart:io';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:path_provider/path_provider.dart';
import 'package:ledger_lite/app/app.dart';
import 'package:ledger_lite/app/providers.dart';
import 'package:ledger_lite/data/database/app_database.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets('Android local entry survives database close/reopen', (tester) async {
    final support = await getApplicationSupportDirectory();
    // Isolated test database: never touches the user's ledger.sqlite.
    final directory = await Directory('${support.path}/integration-fixtures').createTemp('run-');
    final file = File('${directory.path}/fixture.sqlite');
    var db = AppDatabase(NativeDatabase(file));
    var container = ProviderContainer(overrides: [databaseProvider.overrideWithValue(db),
      initialSettingsProvider.overrideWithValue(const AppSettings(onboarded: true))]);
    try {
      await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const LedgerApp()));
      await tester.pumpAndSettle();
      await tester.ensureVisible(find.text('Add an entry'));
      await tester.tap(find.text('Add an entry')); await tester.pumpAndSettle();
      await tester.enterText(find.byKey(const Key('amount-field')), '18.50');
      await tester.ensureVisible(find.byKey(const Key('save-entry')));
      await tester.tap(find.byKey(const Key('save-entry'))); await tester.pumpAndSettle();
      await tester.pumpWidget(const SizedBox.shrink()); container.dispose(); await db.close();
      db = AppDatabase(NativeDatabase(file));
      container = ProviderContainer(overrides: [databaseProvider.overrideWithValue(db),
        initialSettingsProvider.overrideWithValue(const AppSettings(onboarded: true))]);
      await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const LedgerApp()));
      await tester.pumpAndSettle();
      expect(await db.select(db.entries).get(), hasLength(1));
      expect(find.text('RM 18.50'), findsWidgets);
    } finally {
      await tester.pumpWidget(const SizedBox.shrink()); container.dispose(); await db.close();
      await directory.delete(recursive: true);
    }
  });
}
