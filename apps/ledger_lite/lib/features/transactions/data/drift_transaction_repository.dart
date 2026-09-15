import 'package:drift/drift.dart';

import '../../../data/database/app_database.dart';
import '../../../core/business_date.dart';
import '../../../core/money.dart';
import '../domain/ledger_transaction.dart';
import '../domain/transaction_repository.dart';

class DriftTransactionRepository implements TransactionRepository {
  DriftTransactionRepository(this.db);
  final AppDatabase db;

  LedgerTransaction _entry(EntryRow row) => LedgerTransaction(
    id: row.id,
    type: EntryType.values.byName(row.type),
    amountSen: row.amountSen,
    businessDate: row.businessDate,
    categoryId: row.categoryId,
    note: row.note,
    refundDirection: row.refundDirection == null
        ? null
        : RefundDirection.values.firstWhere(
            (d) => d.wire == row.refundDirection,
          ),
    originalTransactionId: row.originalTransactionId,
    fromLabel: row.fromLabel,
    toLabel: row.toLabel,
    createdAt: row.createdAt.toUtc(),
    updatedAt: row.updatedAt.toUtc(),
    revision: row.revision,
  );

  @override
  Stream<List<LedgerTransaction>> watchAll() =>
      (db.select(db.entries)..orderBy([
            (t) => OrderingTerm.desc(t.businessDate),
            (t) => OrderingTerm.desc(t.createdAt),
            (t) => OrderingTerm.asc(t.id),
          ]))
          .watch()
          .map((rows) => rows.map(_entry).toList(growable: false));
  @override
  Stream<List<LedgerCategory>> watchCategories() =>
      (db.select(db.categories)..orderBy([
            (t) => OrderingTerm.asc(t.createdAt),
            (t) => OrderingTerm.asc(t.id),
          ]))
          .watch()
          .map(
            (rows) => rows
                .map(
                  (r) => LedgerCategory(
                    id: r.id,
                    name: r.name,
                    kind: EntryType.values.byName(r.kind),
                    active: r.active,
                    defaultKey: r.defaultKey,
                  ),
                )
                .toList(growable: false),
          );
  @override
  Future<LedgerTransaction?> find(String id) async {
    final row = await (db.select(
      db.entries,
    )..where((t) => t.id.equals(id))).getSingleOrNull();
    return row == null ? null : _entry(row);
  }

  @override
  Future<void> save(
    LedgerTransaction entry, {
    bool isNew = true,
  }) => db.transaction(() async {
    final current = await find(entry.id);
    if (isNew && current != null) throw const LedgerException('duplicate');
    if (!isNew && current == null) throw const LedgerException('missing');
    if (!isNew && current!.revision != entry.revision)
      throw const LedgerException('stale');
    if (!RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    ).hasMatch(entry.id)) {
      throw const LedgerException('invalid');
    }
    if (entry.amountSen <= 0 || entry.amountSen > maxEntrySen)
      throw const LedgerException('amount');
    try {
      parseBusinessDate(entry.businessDate);
    } on FormatException {
      throw const LedgerException('date');
    }
    if (entry.note.length > 2000) throw const LedgerException('invalid');

    String? categoryId = entry.categoryId;
    if (entry.type == EntryType.refund) {
      if (entry.refundDirection == null) throw const LedgerException('refund');
      if (entry.originalTransactionId == null) {
        if (entry.note.trim().isEmpty)
          throw const LedgerException('refundNote');
      } else {
        final original = await find(entry.originalTransactionId!);
        final expected = entry.refundDirection == RefundDirection.customerOut
            ? EntryType.income
            : EntryType.expense;
        if (original == null ||
            original.id == entry.id ||
            original.type != expected ||
            entry.businessDate.compareTo(original.businessDate) < 0) {
          throw const LedgerException('refund');
        }
        categoryId = original.categoryId;
        final siblings =
            await (db.select(db.entries)..where(
                  (t) =>
                      t.originalTransactionId.equals(original.id) &
                      t.id.equals(entry.id).not(),
                ))
                .get();
        final refunded = siblings.fold(
          BigInt.from(entry.amountSen),
          (sum, r) => sum + BigInt.from(r.amountSen),
        );
        if (refunded > BigInt.from(original.amountSen))
          throw const LedgerException('refundLimit');
      }
    } else if (entry.refundDirection != null ||
        entry.originalTransactionId != null) {
      throw const LedgerException('invalid');
    }
    if (entry.type == EntryType.transfer) {
      final from = entry.fromLabel?.trim() ?? '';
      final to = entry.toLabel?.trim() ?? '';
      if (categoryId != null ||
          from.isEmpty ||
          to.isEmpty ||
          from.length > 80 ||
          to.length > 80 ||
          from.toLowerCase() == to.toLowerCase()) {
        throw const LedgerException('transfer');
      }
    } else if (entry.fromLabel != null || entry.toLabel != null) {
      throw const LedgerException('invalid');
    }
    if (categoryId != null) {
      final category = await (db.select(
        db.categories,
      )..where((c) => c.id.equals(categoryId!))).getSingleOrNull();
      final kind = entry.type == EntryType.refund
          ? (entry.refundDirection == RefundDirection.customerOut
                ? 'income'
                : 'expense')
          : entry.type.name;
      final inherited =
          entry.type == EntryType.refund && entry.originalTransactionId != null;
      if (category == null ||
          category.kind != kind ||
          (!category.active &&
              current?.categoryId != categoryId &&
              !inherited)) {
        throw const LedgerException('category');
      }
    }
    final dependents = await (db.select(
      db.entries,
    )..where((t) => t.originalTransactionId.equals(entry.id))).get();
    if (dependents.isNotEmpty) {
      final total = dependents.fold(
        BigInt.zero,
        (sum, r) => sum + BigInt.from(r.amountSen),
      );
      if (entry.type != current!.type ||
          categoryId != current.categoryId ||
          total > BigInt.from(entry.amountSen) ||
          dependents.any(
            (r) => r.businessDate.compareTo(entry.businessDate) < 0,
          )) {
        throw const LedgerException('dependents');
      }
    }
    final row = EntriesCompanion.insert(
      id: entry.id,
      type: entry.type.name,
      amountSen: entry.amountSen,
      businessDate: entry.businessDate,
      occurredAtLocal: '${entry.businessDate}T00:00:00',
      categoryId: Value(categoryId),
      note: Value(entry.note.trim()),
      refundDirection: Value(entry.refundDirection?.wire),
      originalTransactionId: Value(entry.originalTransactionId),
      fromLabel: Value(entry.fromLabel?.trim()),
      toLabel: Value(entry.toLabel?.trim()),
      createdAt: current?.createdAt ?? DateTime.now().toUtc(),
      updatedAt: DateTime.now().toUtc(),
      revision: Value((current?.revision ?? -1) + 1),
    );
    if (isNew) {
      await db.into(db.entries).insert(row);
    } else {
      await (db.update(
        db.entries,
      )..where((t) => t.id.equals(entry.id))).write(row);
    }
  });

  @override
  Future<void> delete(String id) => db.transaction(() async {
    if (await find(id) == null) throw const LedgerException('missing');
    final linked = await (db.select(
      db.entries,
    )..where((t) => t.originalTransactionId.equals(id))).get();
    if (linked.isNotEmpty) throw const LedgerException('dependents');
    // Attachment lifecycle belongs to M2; do not orphan future receipt files.
    final files = await (db.select(
      db.attachments,
    )..where((t) => t.transactionId.equals(id))).get();
    if (files.isNotEmpty) throw const LedgerException('attachments');
    await (db.delete(db.entries)..where((t) => t.id.equals(id))).go();
  });
}
