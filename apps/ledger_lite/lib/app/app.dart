import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/theme.dart';
import '../l10n/generated/app_localizations.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/transactions/transaction_list_screen.dart';
import '../features/transactions/transaction_form_screen.dart';
import 'providers.dart';
import 'shared.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final ready = ref.read(settingsProvider).onboarded;
      if (!ready && state.uri.path != '/welcome') return '/welcome';
      if (ready && state.uri.path == '/welcome') return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/welcome', builder: (_, _) => const OnboardingScreen()),
      GoRoute(
        path: '/transactions/new',
        builder: (_, _) => const TransactionFormScreen(),
      ),
      GoRoute(
        path: '/transactions/:id',
        builder: (_, state) =>
            TransactionFormScreen(entryId: state.pathParameters['id']),
      ),
      ShellRoute(
        builder: (_, state, child) =>
            LedgerShell(location: state.uri.path, child: child),
        routes: [
          GoRoute(path: '/', builder: (_, _) => const DashboardScreen()),
          GoRoute(
            path: '/transactions',
            builder: (_, _) => const TransactionListScreen(),
          ),
          GoRoute(path: '/settings', builder: (_, _) => const SettingsScreen()),
        ],
      ),
    ],
  );
  ref.listen(settingsProvider, (_, _) => router.refresh());
  ref.onDispose(router.dispose);
  return router;
});

class LedgerApp extends ConsumerWidget {
  const LedgerApp({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => MaterialApp.router(
    title: 'Ledger Lite',
    debugShowCheckedModeBanner: false,
    theme: ledgerTheme(),
    locale: Locale(ref.watch(settingsProvider).locale),
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    routerConfig: ref.watch(routerProvider),
  );
}
