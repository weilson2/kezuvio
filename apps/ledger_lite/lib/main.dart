import 'dart:io';

import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

import 'app/app.dart';
import 'app/providers.dart';
import 'core/theme.dart';
import 'data/database/app_database.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LedgerBootstrap());
}

class LedgerBootstrap extends StatefulWidget {
  const LedgerBootstrap({super.key});
  @override
  State<LedgerBootstrap> createState() => _LedgerBootstrapState();
}

class _LedgerBootstrapState extends State<LedgerBootstrap> {
  AppDatabase? db;
  AppSettings? settings;
  bool failed = false;
  @override
  void initState() {
    super.initState();
    _open();
  }

  Future<void> _open() async {
    setState(() => failed = false);
    AppDatabase? candidate;
    try {
      final root = await getApplicationSupportDirectory();
      final folder = Directory(p.join(root.path, appFlavor ?? 'dev'));
      await folder.create(recursive: true);
      candidate = AppDatabase(
        NativeDatabase.createInBackground(
          File(p.join(folder.path, 'ledger.sqlite')),
        ),
      );
      final preferences = await candidate.readPreferences();
      if (!mounted) {
        await candidate.close();
        return;
      }
      setState(() {
        db = candidate;
        settings = AppSettings(
          locale: preferences['locale'] ?? 'en',
          onboarded: preferences['onboarded'] == 'true',
        );
      });
    } catch (_) {
      await candidate?.close();
      if (mounted) setState(() => failed = true);
    }
  }

  @override
  void dispose() {
    db?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (db != null) {
      return ProviderScope(
        overrides: [
          databaseProvider.overrideWithValue(db!),
          initialSettingsProvider.overrideWithValue(settings!),
        ],
        child: const LedgerApp(),
      );
    }
    // The saved locale is unavailable until the database opens.
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ledgerTheme(),
      home: Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: failed
                  ? Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Could not open your ledger. Existing data has not been reset.\n无法打开账本，现有数据未被重置。',
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 20),
                        FilledButton(
                          onPressed: _open,
                          child: const Text('Try again · 重试'),
                        ),
                      ],
                    )
                  : const CircularProgressIndicator(),
            ),
          ),
        ),
      ),
    );
  }
}
