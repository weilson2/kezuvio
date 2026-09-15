import 'package:flutter_test/flutter_test.dart';
import 'package:ledger_lite/core/money.dart';
import 'package:ledger_lite/core/business_date.dart';
import 'package:ledger_lite/features/transactions/domain/cash_flow.dart';
import 'package:ledger_lite/features/transactions/domain/ledger_transaction.dart';

import 'support/fixtures.dart';

void main() {
  test(
    'decimal inputs preserve sen exactly, including cap and leading zeroes',
    () {
      expect(parseSen('18.50'), 1850);
      expect(parseSen('0.01'), 1);
      expect(parseSen('00001.1'), 110);
      expect(parseSen(' 1 '), 100);
      expect(parseSen('9999999999.99'), maxEntrySen);
      expect(decimalSen(1850), '18.50');
    },
  );
  test(
    'rejects negative, zero, exponent, fractional sen and ambiguous separators',
    () {
      for (final text in [
        '',
        '0',
        '-1',
        '1.001',
        '1,00',
        '1e3',
        'NaN',
        'Infinity',
        '+1',
        '.5',
        '1.',
        '10000000000',
        '9999999999.999',
      ]) {
        expect(() => parseSen(text), throwsFormatException, reason: text);
      }
    },
  );
  test('formatting uses exact arithmetic for totals beyond int64', () {
    expect(
      formatMoney(BigInt.parse('9223372036854775808')),
      'RM 92,233,720,368,547,758.08',
    );
    expect(formatMoney(BigInt.from(-1)), '−RM 0.01');
  });
  test('business date rejects overflow and handles leap days', () {
    expect(dateText(parseBusinessDate('2024-02-29')), '2024-02-29');
    for (final text in [
      '2026-02-29',
      '2026-04-31',
      '2026-13-01',
      '2026-01-00',
      '26-01-01',
      '1899-12-31',
      '9999-01-01',
    ]) {
      expect(
        () => parseBusinessDate(text),
        throwsFormatException,
        reason: text,
      );
    }
  });
  test(
    'Malaysia day and half-open month boundaries use UTC+8 consistently',
    () {
      expect(businessToday(DateTime.utc(2026, 10, 31, 15, 59)), '2026-10-31');
      expect(businessToday(DateTime.utc(2026, 10, 31, 16)), '2026-11-01');
      expect(currentMonth(DateTime.utc(2026, 12, 31, 16)), (
        start: '2027-01-01',
        end: '2027-02-01',
      ));
    },
  );
  test(
    'cash flow reconciles both refund directions and excludes transfers',
    () {
      final report = CashFlow(
        [
          entry(amount: 10000),
          entry(type: EntryType.expense, amount: 3000),
          entry(
            type: EntryType.refund,
            amount: 2000,
            direction: RefundDirection.customerOut,
          ),
          entry(
            type: EntryType.refund,
            amount: 500,
            direction: RefundDirection.supplierIn,
          ),
          entry(type: EntryType.transfer, amount: 4000),
          entry(amount: 9000, date: '2026-12-01'),
        ],
        start: '2026-11-01',
        end: '2026-12-01',
      );
      expect(report.inflows, BigInt.from(10500));
      expect(report.outflows, BigInt.from(5000));
      expect(report.net, BigInt.from(5500));
      expect(report.transfers, BigInt.from(4000));
    },
  );
  test('a later-period refund affects its own date range', () {
    final report = CashFlow(
      [
        entry(date: '2026-10-31'),
        entry(
          type: EntryType.refund,
          amount: 1000,
          direction: RefundDirection.customerOut,
        ),
      ],
      start: '2026-11-01',
      end: '2026-12-01',
    );
    expect(report.net, BigInt.from(-1000));
  });
}
