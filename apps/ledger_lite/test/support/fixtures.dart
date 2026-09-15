import 'package:uuid/uuid.dart';
import 'package:ledger_lite/features/transactions/domain/ledger_transaction.dart';

LedgerTransaction entry({
  String? id,
  EntryType type = EntryType.income,
  int amount = 10000,
  String date = '2026-11-02',
  String? category,
  String note = '',
  RefundDirection? direction,
  String? original,
  String? from,
  String? to,
  int revision = 0,
}) => LedgerTransaction(
  id: id ?? const Uuid().v4(),
  type: type,
  amountSen: amount,
  businessDate: date,
  categoryId: category,
  note: note,
  refundDirection: direction,
  originalTransactionId: original,
  fromLabel: from,
  toLabel: to,
  createdAt: DateTime.utc(2026, 11, 2),
  updatedAt: DateTime.utc(2026, 11, 2),
  revision: revision,
);

const salesId = '00000000-0000-4000-8000-000000000001';
const servicesId = '00000000-0000-4000-8000-000000000002';
const suppliesId = '00000000-0000-4000-8000-000000000003';
