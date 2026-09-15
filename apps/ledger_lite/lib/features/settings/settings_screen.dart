import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../app/shared.dart';

class LanguagePicker extends ConsumerStatefulWidget {
  const LanguagePicker({super.key});
  @override
  ConsumerState<LanguagePicker> createState() => _LanguagePickerState();
}

class _LanguagePickerState extends ConsumerState<LanguagePicker> {
  bool busy = false;
  String? error;
  @override
  Widget build(BuildContext context) {
    final l = context.strings;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DropdownButtonFormField<String>(
          key: ValueKey(ref.watch(settingsProvider).locale),
          initialValue: ref.watch(settingsProvider).locale,
          isExpanded: true,
          decoration: InputDecoration(labelText: l.language),
          items: [
            DropdownMenuItem(value: 'en', child: Text(l.english)),
            DropdownMenuItem(value: 'zh', child: Text(l.chinese)),
          ],
          onChanged: busy
              ? null
              : (locale) async {
                  if (locale == null) return;
                  setState(() {
                    busy = true;
                    error = null;
                  });
                  try {
                    await ref.read(settingsProvider.notifier).setLocale(locale);
                  } catch (_) {
                    if (mounted)
                      setState(() => error = context.strings.errorStorage);
                  } finally {
                    if (mounted) setState(() => busy = false);
                  }
                },
        ),
        if (error != null)
          Text(
            error!,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
      ],
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final l = context.strings;
    return PageBody(
      children: [
        Text(l.settings, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 24),
        const LanguagePicker(),
        const SizedBox(height: 24),
        _Section(title: l.currency, body: l.currencyValue),
        _Section(title: l.businessTime, body: l.businessTimeValue),
        _Section(title: l.privacy, body: l.privacyBody),
        _Section(title: l.about, body: l.aboutBody),
        Notice(text: l.developmentNotice),
        const SizedBox(height: 20),
        _Section(title: l.comingNext, body: l.comingNextBody),
      ],
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.body});
  final String title;
  final String body;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleMedium
              ?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        Text(body, style: const TextStyle(height: 1.5)),
      ],
    ),
  );
}
