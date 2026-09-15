import 'package:flutter/material.dart';

abstract final class Brand {
  static const indigo = Color(0xFF6366F1);
  static const primary = Color(0xFF4F46E5);
  static const purple = Color(0xFFA855F7);
  static const cyan = Color(0xFF06B6D4);
  static const navy = Color(0xFF0F172A);
  static const cloud = Color(0xFFF8FAFC);
}

ThemeData ledgerTheme() {
  final scheme =
      ColorScheme.fromSeed(
        seedColor: Brand.primary,
        brightness: Brightness.light,
      ).copyWith(
        primary: Brand.primary,
        surface: Colors.white,
        onSurface: Brand.navy,
      );
  return ThemeData(
    useMaterial3: true,
    fontFamilyFallback: const ['Noto Sans SC', 'sans-serif'],
    colorScheme: scheme,
    scaffoldBackgroundColor: Brand.cloud,
    visualDensity: VisualDensity.standard,
    appBarTheme: const AppBarTheme(
      backgroundColor: Brand.cloud,
      foregroundColor: Brand.navy,
      centerTitle: false,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(minimumSize: const Size(48, 52)),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(minimumSize: const Size(48, 48)),
    ),
  );
}
