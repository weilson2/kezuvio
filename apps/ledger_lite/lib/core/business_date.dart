String businessToday([DateTime? instant]) {
  final malaysia = (instant ?? DateTime.now()).toUtc().add(
    const Duration(hours: 8),
  );
  return dateText(malaysia);
}

String dateText(DateTime date) =>
    '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

DateTime parseBusinessDate(String text) {
  if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(text)) {
    throw const FormatException('date');
  }
  final year = int.parse(text.substring(0, 4));
  final month = int.parse(text.substring(5, 7));
  final day = int.parse(text.substring(8));
  final date = DateTime.utc(year, month, day);
  if (year < 1900 || year > 9998 || dateText(date) != text) {
    throw const FormatException('date');
  }
  return date;
}

({String start, String end}) currentMonth([DateTime? instant]) {
  final today = parseBusinessDate(businessToday(instant));
  return (
    start: dateText(DateTime.utc(today.year, today.month)),
    end: dateText(DateTime.utc(today.year, today.month + 1)),
  );
}
