import 'ledger_transaction.dart';

abstract interface class TransactionRepository {
  Stream<List<LedgerTransaction>> watchAll();
  Stream<List<LedgerCategory>> watchCategories();
  Future<LedgerTransaction?> find(String id);
  Future<void> save(LedgerTransaction entry, {bool isNew = true});
  Future<void> delete(String id);
}
