import 'dart:io';

import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ledger_lite/data/database/app_database.dart';
import 'package:ledger_lite/features/transactions/data/drift_transaction_repository.dart';
import 'package:ledger_lite/features/transactions/domain/ledger_transaction.dart';

import 'support/fixtures.dart';

Matcher code(String code) =>
    throwsA(isA<LedgerException>().having((e) => e.code, 'code', code));

void main() {
  late AppDatabase db;
  late DriftTransactionRepository repo;
  var closed = false;
  setUp(() {
    db = AppDatabase(NativeDatabase.memory());
    repo = DriftTransactionRepository(db);
    closed = false;
  });
  tearDown(() async { if (!closed) await db.close(); });
  test(
    'seeded categories and CRUD survive queries with immutable creation time',
    () async {
      expect(await repo.watchCategories().first, hasLength(5));
      final original = entry(category: salesId);
      await repo.save(original);
      final saved = (await repo.find(original.id))!;
      await repo.save(
        entry(
          id: saved.id,
          amount: 1250,
          category: salesId,
          note: 'Corrected',
          revision: saved.revision,
        ),
        isNew: false,
      );
      final updated = (await repo.find(saved.id))!;
      expect(updated.amountSen, 1250);
      expect(updated.createdAt, saved.createdAt);
      expect(updated.revision, saved.revision + 1);
      await repo.delete(saved.id);
      expect(await repo.find(saved.id), isNull);
    },
  );
  test(
    'invalid amount, date and category leave the ledger unchanged',
    () async {
      final original = entry();
      await repo.save(original);
      await expectLater(repo.save(entry(amount: -1)), code('amount'));
      await expectLater(repo.save(entry(date: '2026-02-30')), code('date'));
      await expectLater(
        repo.save(entry(category: suppliesId)),
        code('category'),
      );
      expect(await repo.watchAll().first, hasLength(1));
    },
  );
  test(
    'refunds inherit categories, enforce direction/date and total cap',
    () async {
      final original = entry(category: salesId);
      await repo.save(original);
      final refund = entry(
        type: EntryType.refund,
        amount: 8000,
        direction: RefundDirection.customerOut,
        original: original.id,
      );
      await repo.save(refund);
      expect((await repo.find(refund.id))!.categoryId, salesId);
      await expectLater(
        repo.save(
          entry(
            type: EntryType.refund,
            amount: 2001,
            direction: RefundDirection.customerOut,
            original: original.id,
          ),
        ),
        code('refundLimit'),
      );
      await expectLater(
        repo.save(
          entry(
            type: EntryType.refund,
            amount: 1,
            direction: RefundDirection.supplierIn,
            original: original.id,
          ),
        ),
        code('refund'),
      );
      await expectLater(
        repo.save(
          entry(
            type: EntryType.refund,
            amount: 1,
            direction: RefundDirection.customerOut,
            original: original.id,
            date: '2026-11-01',
          ),
        ),
        code('refund'),
      );
    },
  );
  test('editing a refund excludes itself from the total', () async {
    final original = entry();
    await repo.save(original);
    final refund = entry(
      type: EntryType.refund,
      amount: 8000,
      direction: RefundDirection.customerOut,
      original: original.id,
    );
    await repo.save(refund);
    await repo.save(
      entry(
        id: refund.id,
        type: EntryType.refund,
        amount: 9000,
        direction: RefundDirection.customerOut,
        original: original.id,
      ),
      isNew: false,
    );
    expect((await repo.find(refund.id))!.amountSen, 9000);
  });
  test(
    'concurrent refunds cannot jointly exceed the original amount',
    () async {
      final original = entry();
      await repo.save(original);
      final outcomes = await Future.wait(
        List.generate(2, (_) async {
          try {
            await repo.save(
              entry(
                type: EntryType.refund,
                amount: 6000,
                direction: RefundDirection.customerOut,
                original: original.id,
              ),
            );
            return true;
          } on LedgerException catch (e) {
            expect(e.code, 'refundLimit');
            return false;
          }
        }),
      );
      expect(outcomes.where((ok) => ok), hasLength(1));
    },
  );
  test('originals with refunds cannot be deleted or invalidated', () async {
    final original = entry(category: salesId);
    await repo.save(original);
    final refund = entry(
      type: EntryType.refund,
      amount: 5000,
      direction: RefundDirection.customerOut,
      original: original.id,
    );
    await repo.save(refund);
    await expectLater(repo.delete(original.id), code('dependents'));
    await expectLater(
      repo.save(
        entry(id: original.id, amount: 4000, category: salesId),
        isNew: false,
      ),
      code('dependents'),
    );
    await expectLater(
      repo.save(entry(id: original.id, category: servicesId), isNew: false),
      code('dependents'),
    );
    await expectLater(
      repo.save(
        entry(id: original.id, category: salesId, date: '2026-11-03'),
        isNew: false,
      ),
      code('dependents'),
    );
    await repo.delete(refund.id);
    await repo.delete(original.id);
    expect(await repo.watchAll().first, isEmpty);
  });
  test('unlinked refunds require explanation and transfers require distinct locations', () async {
    await expectLater(
      repo.save(
        entry(type: EntryType.refund, direction: RefundDirection.supplierIn),
      ),
      code('refundNote'),
    );
    await repo.save(
      entry(
        type: EntryType.refund,
        direction: RefundDirection.supplierIn,
        note: 'Historical return',
      ),
    );
    await expectLater(
      repo.save(entry(type: EntryType.transfer, from: 'Cash', to: ' cash ')),
      code('transfer'),
    );
    await repo.save(
      entry(type: EntryType.transfer, from: 'Cash', to: 'Business bank'),
    );
  });
  test(
    'stale edits and duplicate creates never overwrite saved records',
    () async {
      final original = entry();
      await repo.save(original);
      await expectLater(repo.save(original), code('duplicate'));
      await repo.save(entry(id: original.id, amount: 20000), isNew: false);
      await expectLater(repo.save(original, isNew: false), code('stale'));
      expect((await repo.find(original.id))!.amountSen, 20000);
    },
  );
  test(
    'archived category remains on old entries but cannot be newly selected',
    () async {
      final original = entry(category: salesId);
      await repo.save(original);
      await (db.update(db.categories)..where((c) => c.id.equals(salesId)))
          .write(const CategoriesCompanion(active: Value(false)));
      await repo.save(
        entry(id: original.id, category: salesId, note: 'Existing'),
        isNew: false,
      );
      await expectLater(repo.save(entry(category: salesId)), code('category'));
    },
  );
  test(
    'database constraints reject invalid SQL even outside the repository',
    () async {
      final original = entry();
      await repo.save(original);
      for (final assignment in [
        "amount_sen = 0",
        "currency = 'USD'",
        "business_date = '2026-02-30'",
        "category_id = 'unknown'",
        "type = 'invalid'",
      ]) {
        await expectLater(
          db.customStatement('UPDATE entries SET $assignment'),
          throwsA(anything),
        );
      }
      expect((await repo.find(original.id))!.amountSen, 10000);
    },
  );
  test('preferences enforce supported language and are persisted', () async {
    await db.setPreference('locale', 'zh');
    await db.setPreference('onboarded', 'true');
    expect(await db.readPreferences(), {'locale': 'zh', 'onboarded': 'true'});
    await expectLater(db.setPreference('locale', 'unknown'), throwsA(anything));
  });
  test('a failed transaction rolls back every write', () async {
    await expectLater(
      db.transaction(() async {
        await repo.save(entry());
        throw StateError('simulated failure');
      }),
      throwsStateError,
    );
    expect(await repo.watchAll().first, isEmpty);
  });
  test(
    'file-backed database preserves records and preferences after close/reopen',
    () async {
      final dir = await Directory.systemTemp.createTemp('ledger-reopen-');
      await db.close(); closed = true;
      final file = File('${dir.path}/ledger.sqlite');
      final original = entry(note: 'Synthetic persistence fixture');
      var disk = AppDatabase(NativeDatabase(file));
      try {
        await DriftTransactionRepository(disk).save(original);
        await disk.setPreference('locale', 'zh');
        await disk.close();
        disk = AppDatabase(NativeDatabase(file));
        expect(
          (await DriftTransactionRepository(disk).find(original.id))!.note,
          original.note,
        );
        expect((await disk.readPreferences())['locale'], 'zh');
      } finally {
        await disk.close();
        await dir.delete(recursive: true);
      }
    },
  );
  test('future schema is refused without erasing the data', () async {
    final dir = await Directory.systemTemp.createTemp('ledger-future-');
    await db.close(); closed = true;
    final file = File('${dir.path}/ledger.sqlite');
    final disk = AppDatabase(NativeDatabase(file));
    await DriftTransactionRepository(disk).save(entry());
    await disk.customStatement('PRAGMA user_version = 2');
    await disk.close();
    final bytes = await file.readAsBytes();
    final future = AppDatabase(NativeDatabase(file));
    try {
      await expectLater(future.readPreferences(), throwsA(anything));
    } finally {
      await future.close();
    }
    expect(await file.readAsBytes(), bytes);
    await dir.delete(recursive: true);
  });
}
