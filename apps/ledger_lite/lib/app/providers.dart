import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/database/app_database.dart';
import '../features/transactions/data/drift_transaction_repository.dart';
import '../features/transactions/domain/transaction_repository.dart';
import '../features/transactions/domain/ledger_transaction.dart';

final databaseProvider = Provider<AppDatabase>(
  (ref) => throw StateError('Database not initialized'),
);
final repositoryProvider = Provider<TransactionRepository>(
  (ref) => DriftTransactionRepository(ref.watch(databaseProvider)),
);
final transactionsProvider = StreamProvider<List<LedgerTransaction>>(
  (ref) => ref.watch(repositoryProvider).watchAll(),
);
final categoriesProvider = StreamProvider<List<LedgerCategory>>(
  (ref) => ref.watch(repositoryProvider).watchCategories(),
);

class AppSettings {
  const AppSettings({this.locale = 'en', this.onboarded = false});
  final String locale;
  final bool onboarded;
}

final initialSettingsProvider = Provider<AppSettings>(
  (ref) => const AppSettings(),
);
final settingsProvider = NotifierProvider<SettingsController, AppSettings>(
  SettingsController.new,
);

class SettingsController extends Notifier<AppSettings> {
  @override
  AppSettings build() => ref.read(initialSettingsProvider);
  Future<void> setLocale(String locale) async {
    if (locale != 'en' && locale != 'zh') return;
    await ref.read(databaseProvider).setPreference('locale', locale);
    state = AppSettings(locale: locale, onboarded: state.onboarded);
  }

  Future<void> finishOnboarding() async {
    await ref.read(databaseProvider).setPreference('onboarded', 'true');
    state = AppSettings(locale: state.locale, onboarded: true);
  }
}
