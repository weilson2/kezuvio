import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../l10n/generated/app_localizations.dart';
import '../features/transactions/domain/ledger_transaction.dart';

extension LedgerStrings on BuildContext {
  AppLocalizations get strings => AppLocalizations.of(this);
}

String typeLabel(AppLocalizations l, EntryType type) => switch (type) {
  EntryType.income => l.income,
  EntryType.expense => l.expense,
  EntryType.refund => l.refund,
  EntryType.transfer => l.transfer,
};
String categoryLabel(AppLocalizations l, LedgerCategory? category) =>
    switch (category?.defaultKey) {
      'sales' => l.sales,
      'services' => l.services,
      'supplies' => l.supplies,
      'transport' => l.transport,
      'rent' => l.rent,
      _ => category?.name ?? l.uncategorized,
    };
String errorLabel(AppLocalizations l, Object error) =>
    switch (error is LedgerException ? error.code : '') {
      'amount' => l.errorAmount,
      'date' => l.errorDate,
      'refund' => l.errorRefund,
      'refundLimit' => l.errorRefundLimit,
      'refundNote' => l.errorRefundNote,
      'transfer' => l.errorTransfer,
      'category' => l.errorCategory,
      'dependents' => l.errorDependents,
      'stale' => l.errorStale,
      'missing' => l.errorMissing,
      'duplicate' => l.errorDuplicate,
      'attachments' => l.errorAttachments,
      'invalid' => l.errorInvalid,
      _ => l.errorStorage,
    };

class PageBody extends StatelessWidget {
  const PageBody({super.key, required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) => SingleChildScrollView(
    padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
    child: Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 720),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: children,
        ),
      ),
    ),
  );
}

class LedgerShell extends StatelessWidget {
  const LedgerShell({super.key, required this.child, required this.location});
  final Widget child;
  final String location;
  @override
  Widget build(BuildContext context) {
    final l = context.strings;
    final index = location.startsWith('/transactions')
        ? 1
        : location == '/settings'
        ? 2
        : 0;
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset(
              'assets/brand/icon.png',
              width: 32,
              height: 32,
              excludeFromSemantics: true,
            ),
            const SizedBox(width: 10),
            const Flexible(child: Text('Ledger Lite')),
          ],
        ),
      ),
      body: SafeArea(top: false, child: child),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) =>
            context.go(['/', '/transactions', '/settings'][i]),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.space_dashboard_outlined),
            selectedIcon: const Icon(Icons.space_dashboard),
            label: l.dashboard,
          ),
          NavigationDestination(
            icon: const Icon(Icons.receipt_long_outlined),
            selectedIcon: const Icon(Icons.receipt_long),
            label: l.transactions,
          ),
          NavigationDestination(
            icon: const Icon(Icons.settings_outlined),
            selectedIcon: const Icon(Icons.settings),
            label: l.settings,
          ),
        ],
      ),
    );
  }
}

class LoadError extends StatelessWidget {
  const LoadError({super.key, required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => PageBody(
    children: [
      Text(
        context.strings.errorStorage,
        semanticsLabel: context.strings.errorStorage,
      ),
      const SizedBox(height: 16),
      OutlinedButton(onPressed: onRetry, child: Text(context.strings.retry)),
    ],
  );
}

class Notice extends StatelessWidget {
  const Notice({super.key, required this.text});
  final String text;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: const Color(0xFFEEF0FF),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Text(
      text,
      style: const TextStyle(color: Color(0xFF3730A3), height: 1.5),
    ),
  );
}
