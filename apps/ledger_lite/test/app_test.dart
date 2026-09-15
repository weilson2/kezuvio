import 'dart:io';
import 'dart:ui' as ui;

import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ledger_lite/app/app.dart';
import 'package:ledger_lite/app/providers.dart';
import 'package:ledger_lite/core/business_date.dart';
import 'package:ledger_lite/data/database/app_database.dart';
import 'package:ledger_lite/features/transactions/domain/ledger_transaction.dart';

import 'support/fixtures.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async {
    // Load workstation fonts for local visual evidence only; no font is redistributed.
    final roboto = File(
      '../../tmp/toolchains/flutter/bin/cache/artifacts/material_fonts/roboto-regular.ttf',
    );
    if (await roboto.exists()) {
      await (FontLoader('Roboto')..addFont(
            Future.value(ByteData.sublistView(await roboto.readAsBytes())),
          ))
          .load();
    }
    final chinese = File('C:/Windows/Fonts/msyh.ttc');
    if (await chinese.exists()) {
      await (FontLoader('Noto Sans SC')..addFont(
            Future.value(ByteData.sublistView(await chinese.readAsBytes())),
          ))
          .load();
    }
  });
  Future<({AppDatabase db, ProviderContainer container})> mount(
    WidgetTester tester, {
    String locale = 'en',
    bool onboarded = true,
    bool seed = false,
    double scale = 1,
  }) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1;
    tester.platformDispatcher.textScaleFactorTestValue = scale;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
      tester.platformDispatcher.clearTextScaleFactorTestValue();
    });
    final db = AppDatabase(NativeDatabase.memory());
    await db.readPreferences();
    final container = ProviderContainer(
      overrides: [
        databaseProvider.overrideWithValue(db),
        initialSettingsProvider.overrideWithValue(
          AppSettings(locale: locale, onboarded: onboarded),
        ),
      ],
    );
    if (seed) {
      final repo = container.read(repositoryProvider);
      await repo.save(
        entry(
          amount: 125000,
          date: businessToday(),
          category: salesId,
          note: 'Sample sale · 示例销售',
        ),
      );
      await repo.save(
        entry(
          type: EntryType.expense,
          amount: 1850,
          date: businessToday(),
          category: suppliesId,
          note: 'Sample supplies · 示例用品',
        ),
      );
    }
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const RepaintBoundary(key: Key('capture'), child: LedgerApp()),
      ),
    );
    await tester.pumpAndSettle();
    addTearDown(() async {
      await tester.pumpWidget(const SizedBox.shrink());
      container.dispose();
      await db.close();
    });
    return (db: db, container: container);
  }

  Future<void> screenshot(WidgetTester tester, String name) async {
    if (!const bool.fromEnvironment('CAPTURE_LEDGER')) return;
    final boundary = tester.renderObject<RenderRepaintBoundary>(
      find.byKey(const Key('capture')),
    );
    await tester.runAsync(() async {
      final image = await boundary.toImage();
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      final directory = Directory('../../docs/previews/ledger-m1');
      await directory.create(recursive: true);
      await File('${directory.path}/$name.png')
          .writeAsBytes(bytes!.buffer.asUint8List());
      image.dispose();
    });
  }

  Future<void> tapVisible(WidgetTester tester, Finder finder) async {
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  testWidgets(
    'onboarding language switch persists before entering the ledger',
    (tester) async {
      final setup = await mount(tester, onboarded: false);
      expect(find.text('A clearer view of your business.'), findsOneWidget);
      await tapVisible(tester, find.byType(DropdownButtonFormField<String>));
      await tester.tap(find.text('简体中文').last);
      await tester.pumpAndSettle();
      expect(find.text('生意收支，一目了然。'), findsOneWidget);
      await tapVisible(tester, find.text('开始记账'));
      expect(find.text('本月收支'), findsOneWidget);
      expect(await setup.db.readPreferences(), {
        'locale': 'zh',
        'onboarded': 'true',
      });
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'income/expense create edit and confirmed deletion update persistent data',
    (tester) async {
      final setup = await mount(tester);
      await tapVisible(tester, find.text('Add an entry'));
      await tester.enterText(find.byKey(const Key('amount-field')), '18.50');
      await tester.enterText(
        find.byKey(const Key('note-field')),
        'Sample purchase',
      );
      await tapVisible(tester, find.byKey(const Key('save-entry')));
      final saved = (await setup.db.select(setup.db.entries).get()).single;
      expect(saved.amountSen, 1850);
      expect(saved.type, 'expense');
      await tapVisible(tester, find.text('Sample purchase'));
      await tester.enterText(find.byKey(const Key('amount-field')), '20.05');
      await tapVisible(tester, find.byKey(const Key('save-entry')));
      expect(
        (await setup.container.read(repositoryProvider).find(saved.id))!
            .amountSen,
        2005,
      );
      await tapVisible(tester, find.text('Sample purchase'));
      await tapVisible(tester, find.byKey(const Key('delete-entry')));
      await tester.tap(find.text('Cancel').last);
      await tester.pumpAndSettle();
      expect(
        await setup.container.read(repositoryProvider).find(saved.id),
        isNotNull,
      );
      await tapVisible(tester, find.byKey(const Key('delete-entry')));
      await tester.tap(find.text('Delete permanently'));
      await tester.pumpAndSettle();
      expect(
        await setup.container.read(repositoryProvider).find(saved.id),
        isNull,
      );
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets('invalid money remains on form without writing an entry', (
    tester,
  ) async {
    final setup = await mount(tester);
    await tapVisible(tester, find.text('Add an entry'));
    await tester.enterText(find.byKey(const Key('amount-field')), '-1.005');
    await tapVisible(tester, find.byKey(const Key('save-entry')));
    expect(find.textContaining('Enter an amount from'), findsOneWidget);
    expect(
      await setup.db.select(setup.db.entries).get(),
      isEmpty,
    );
    expect(tester.takeException(), isNull);
  });

  for (final locale in ['en', 'zh']) {
    for (final scale in [1.0, 2.0]) {
      testWidgets(
        '$locale screens at 360px and ${scale}x text have no layout errors',
        (tester) async {
          final setup = await mount(
            tester,
            locale: locale,
            seed: true,
            scale: scale,
          );
          for (final page in [
            ('overview', '/'),
            ('entries', '/transactions'),
            ('settings', '/settings'),
            ('form', '/transactions/new'),
          ]) {
            setup.container.read(routerProvider).go(page.$2);
            await tester.pumpAndSettle();
            expect(
              tester.takeException(),
              isNull,
              reason: '${page.$1} $locale $scale',
            );
            if (scale == 1) await screenshot(tester, '${page.$1}-$locale');
          }
        },
      );
    }
    testWidgets('$locale onboarding fits at 360px and 2x text', (tester) async {
      await mount(tester, locale: locale, onboarded: false, scale: 2);
      expect(tester.takeException(), isNull);
    });
  }
}
