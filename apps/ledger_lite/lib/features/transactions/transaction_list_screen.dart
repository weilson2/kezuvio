import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../app/providers.dart';
import '../../app/shared.dart';
import '../../core/money.dart';
import 'domain/ledger_transaction.dart';

class TransactionListScreen extends ConsumerWidget {
  const TransactionListScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.strings;
    return ref
        .watch(transactionsProvider)
        .when(
          loading: () => Center(
            child: CircularProgressIndicator(semanticsLabel: l.loading),
          ),
          error: (_, _) =>
              LoadError(onRetry: () => ref.invalidate(transactionsProvider)),
          data: (entries) => CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        l.allEntries,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: () => context.push('/transactions/new'),
                        icon: const Icon(Icons.add),
                        label: Text(l.addEntry),
                      ),
                      if (entries.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 40),
                          child: Text(l.emptyBody),
                        ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                sliver: SliverList.builder(
                  itemCount: entries.length,
                  itemBuilder: (context, i) => Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 720),
                      child: EntryCard(entry: entries[i]),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
  }
}

class EntryCard extends ConsumerWidget {
  const EntryCard({super.key, required this.entry});
  final LedgerTransaction entry;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l = context.strings;
    final categories =
        ref.watch(categoriesProvider).asData?.value ?? <LedgerCategory>[];
    final category = categories
        .where((c) => c.id == entry.categoryId)
        .firstOrNull;
    final detail = entry.type == EntryType.transfer
        ? '${entry.fromLabel} → ${entry.toLabel}'
        : entry.type == EntryType.refund
        ? (entry.refundDirection == RefundDirection.customerOut
              ? l.customerRefund
              : l.supplierRefund)
        : categoryLabel(l, category);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => context.push('/transactions/${entry.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 16,
                runSpacing: 4,
                alignment: WrapAlignment.spaceBetween,
                children: [
                  Text(
                    typeLabel(l, entry.type),
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                  Text(
                    formatMoney(BigInt.from(entry.amountSen)),
                    style: Theme.of(context).textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(detail, maxLines: 2, overflow: TextOverflow.ellipsis),
              if (entry.note.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    entry.note,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              const SizedBox(height: 6),
              Text(
                entry.businessDate,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
