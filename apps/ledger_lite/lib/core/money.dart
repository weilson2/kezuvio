const maxEntrySen = 999999999999;

/// Decimal input is parsed without binary floating point or silent rounding.
int parseSen(String input) {
  final text = input.trim();
  if (!RegExp(r'^\d{1,10}(\.\d{1,2})?$').hasMatch(text)) {
    throw const FormatException('amount');
  }
  final parts = text.split('.');
  final sen =
      int.parse(parts.first) * 100 +
      (parts.length == 2 ? int.parse(parts[1].padRight(2, '0')) : 0);
  if (sen <= 0 || sen > maxEntrySen) throw const FormatException('amount');
  return sen;
}

String decimalSen(int sen) =>
    '${sen ~/ 100}.${(sen % 100).toString().padLeft(2, '0')}';

/// BigInt also keeps accumulated report values exact beyond int64.
String formatMoney(BigInt value) {
  final magnitude = value.abs();
  final whole = (magnitude ~/ BigInt.from(100)).toString();
  final grouped = whole.replaceAllMapped(
    RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
    (m) => '${m[1]},',
  );
  return '${value.isNegative ? '−' : ''}RM $grouped.${(magnitude % BigInt.from(100)).toString().padLeft(2, '0')}';
}
