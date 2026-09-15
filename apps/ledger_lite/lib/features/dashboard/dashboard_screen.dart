import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/providers.dart';
import '../../app/shared.dart';
import '../../core/business_date.dart';
import '../../core/money.dart';
import '../../core/theme.dart';
import '../transactions/domain/cash_flow.dart';
import '../transactions/transaction_list_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.strings;
    final entries = ref.watch(transactionsProvider);
    return entries.when(
      loading: () =>
          Center(child: CircularProgressIndicator(semanticsLabel: l.loading)),
      error: (_, _) =>
          LoadError(onRetry: () => ref.invalidate(transactionsProvider)),
      data: (rows) {
        final range = currentMonth();
        final totals = CashFlow(rows, start: range.start, end: range.end);
        return PageBody(
          children: [
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  l.thisMonth,
                  style: Theme.of(context).textTheme.headlineMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
                Chip(
                  avatar: const Icon(Icons.offline_pin_outlined, size: 18),
                  label: Text(l.offlineBadge),
                ),
              ],
            ),
            Text(
              range.start.substring(0, 7),
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: 8),
            Text(l.monthSubtitle),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Brand.navy,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l.netCashFlow,
                    style: const TextStyle(
                      color: Color(0xFFCBD5E1),
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    formatMoney(totals.net),
                    key: const Key('net-total'),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l.cashFlowHelp,
                    style: const TextStyle(
                      color: Color(0xFFCBD5E1),
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _MoneyCard(
              label: l.inflows,
              amount: totals.inflows,
              icon: Icons.south_west,
              color: const Color(0xFF166534),
            ),
            _MoneyCard(
              label: l.outflows,
              amount: totals.outflows,
              icon: Icons.north_east,
              color: Brand.primary,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => context.push('/transactions/new'),
              icon: const Icon(Icons.add),
              label: Text(l.addEntry),
            ),
            const SizedBox(height: 24),
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  l.recentEntries,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                TextButton(
                  onPressed: () => context.go('/transactions'),
                  child: Text(l.viewAll),
                ),
              ],
            ),
            if (rows.isEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.receipt_long_outlined,
                        size: 36,
                        color: Brand.primary,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        l.emptyTitle,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(l.emptyBody, textAlign: TextAlign.center),
                    ],
                  ),
                ),
              ),
            ] else
              ...rows.take(5).map((entry) => EntryCard(entry: entry)),
            const SizedBox(height: 20),
            Notice(text: l.developmentNotice),
          ],
        );
      },
    );
  }
}

class _MoneyCard extends StatelessWidget {
  const _MoneyCard({
    required this.label,
    required this.amount,
    required this.icon,
    required this.color,
  });
  final String label;
  final BigInt amount;
  final IconData icon;
  final Color color;
  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label),
                const SizedBox(height: 4),
                Text(
                  formatMoney(amount),
                  style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
