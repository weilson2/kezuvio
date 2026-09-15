import 'ledger_transaction.dart';

class CashFlow {
  CashFlow(
    Iterable<LedgerTransaction> entries, {
    required String start,
    required String end,
  }) {
    for (final entry in entries) {
      if (entry.businessDate.compareTo(start) < 0 ||
          entry.businessDate.compareTo(end) >= 0)
        continue;
      final amount = BigInt.from(entry.amountSen);
      switch (entry.type) {
        case EntryType.income:
          income += amount;
        case EntryType.expense:
          expenses += amount;
        case EntryType.transfer:
          transfers += amount;
        case EntryType.refund:
          if (entry.refundDirection == RefundDirection.customerOut) {
            customerRefunds += amount;
          } else {
            supplierRefunds += amount;
          }
      }
    }
  }
  BigInt income = BigInt.zero;
  BigInt expenses = BigInt.zero;
  BigInt customerRefunds = BigInt.zero;
  BigInt supplierRefunds = BigInt.zero;
  BigInt transfers = BigInt.zero;
  BigInt get inflows => income + supplierRefunds;
  BigInt get outflows => expenses + customerRefunds;
  BigInt get net => inflows - outflows;
}
