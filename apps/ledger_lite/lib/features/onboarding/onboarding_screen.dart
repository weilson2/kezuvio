import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/providers.dart';
import '../../app/shared.dart';
import '../settings/settings_screen.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});
  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  bool busy = false;
  bool failed = false;
  @override
  Widget build(BuildContext context) {
    final l = context.strings;
    return Scaffold(
      body: SafeArea(
        child: PageBody(
          children: [
            const SizedBox(height: 28),
            Align(
              alignment: Alignment.centerLeft,
              child: Image.asset(
                'assets/brand/icon.png',
                width: 80,
                height: 80,
                excludeFromSemantics: true,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'KEZUVIO LABS',
              style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 2),
            ),
            const SizedBox(height: 12),
            Text(
              l.welcomeTitle,
              style: Theme.of(context).textTheme.headlineLarge
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            Text(
              l.welcomeSubtitle,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 32),
            const LanguagePicker(),
            const SizedBox(height: 24),
            Text(
              l.localTitle,
              style: Theme.of(context).textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(l.localDisclosure, style: const TextStyle(height: 1.5)),
            const SizedBox(height: 20),
            Notice(text: l.developmentNotice),
            const SizedBox(height: 24),
            if (failed)
              Text(
                l.errorStorage,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            FilledButton(
              onPressed: busy
                  ? null
                  : () async {
                      setState(() {
                        busy = true;
                        failed = false;
                      });
                      try {
                        await ref
                            .read(settingsProvider.notifier)
                            .finishOnboarding();
                      } catch (_) {
                        if (mounted) setState(() => failed = true);
                      } finally {
                        if (mounted) setState(() => busy = false);
                      }
                    },
              child: Text(busy ? l.saving : l.start),
            ),
          ],
        ),
      ),
    );
  }
}
