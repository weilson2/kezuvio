enum EntryType { income, expense, refund, transfer }

enum RefundDirection {
  customerOut('customer_out'),
  supplierIn('supplier_in');

  const RefundDirection(this.wire);
  final String wire;
}

class LedgerException implements Exception {
  const LedgerException(this.code);
  final String code;
  @override
  String toString() => 'LedgerException($code)';
}

class LedgerTransaction {
  const LedgerTransaction({
    required this.id,
    required this.type,
    required this.amountSen,
    required this.businessDate,
    required this.createdAt,
    required this.updatedAt,
    this.categoryId,
    this.note = '',
    this.refundDirection,
    this.originalTransactionId,
    this.fromLabel,
    this.toLabel,
    this.revision = 0,
  });
  final String id;
  final EntryType type;
  final int amountSen;
  final String businessDate;
  final String? categoryId;
  final String note;
  final RefundDirection? refundDirection;
  final String? originalTransactionId;
  final String? fromLabel;
  final String? toLabel;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int revision;
}

class LedgerCategory {
  const LedgerCategory({
    required this.id,
    required this.name,
    required this.kind,
    required this.active,
    this.defaultKey,
  });
  final String id;
  final String name;
  final EntryType kind;
  final bool active;
  final String? defaultKey;
}
