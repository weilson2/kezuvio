// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Ledger Lite';

  @override
  String get dashboard => 'Overview';

  @override
  String get transactions => 'Entries';

  @override
  String get settings => 'Settings';

  @override
  String get welcomeTitle => 'A clearer view of your business.';

  @override
  String get welcomeSubtitle =>
      'Record money in and out. Keep your day simple.';

  @override
  String get localTitle => 'Your records, on this device';

  @override
  String get localDisclosure =>
      'Records stay in this app on this device. No account or automatic upload. Losing or uninstalling the app can lose your records.';

  @override
  String get developmentNotice =>
      'Development preview · Use sample data only. Backup and export are not available yet.';

  @override
  String get start => 'Start my ledger';

  @override
  String get language => 'Language';

  @override
  String get english => 'English';

  @override
  String get chinese => '简体中文';

  @override
  String get thisMonth => 'This month';

  @override
  String get monthSubtitle =>
      'A simple picture of money moving through your business.';

  @override
  String get inflows => 'Inflows';

  @override
  String get outflows => 'Outflows';

  @override
  String get netCashFlow => 'Net cash flow';

  @override
  String get cashFlowHelp =>
      'Money received minus money paid. This is not an accounting or tax profit report.';

  @override
  String get addEntry => 'Add an entry';

  @override
  String get editEntry => 'Edit entry';

  @override
  String get recentEntries => 'Recent entries';

  @override
  String get viewAll => 'View all';

  @override
  String get emptyTitle => 'Your ledger starts here';

  @override
  String get emptyBody =>
      'Add your first income or expense to see your monthly cash flow.';

  @override
  String get allEntries => 'Your entries';

  @override
  String get entryType => 'Entry type';

  @override
  String get income => 'Income';

  @override
  String get expense => 'Expense';

  @override
  String get refund => 'Refund';

  @override
  String get transfer => 'Internal transfer';

  @override
  String get amount => 'Amount (RM)';

  @override
  String get amountHelp =>
      'For example, 18.50. Enter a positive amount with up to two decimal places.';

  @override
  String get date => 'Transaction date';

  @override
  String get chooseDate => 'Choose date';

  @override
  String get category => 'Category';

  @override
  String get uncategorized => 'Uncategorized';

  @override
  String get note => 'Note';

  @override
  String get noteHint => 'What was this for?';

  @override
  String get refundDirection => 'Refund direction';

  @override
  String get customerRefund => 'Refund to a customer';

  @override
  String get supplierRefund => 'Refund from a supplier';

  @override
  String get refundFor => 'Original entry';

  @override
  String get unlinkedRefund => 'No original entry in this ledger';

  @override
  String get refundHelp =>
      'Linked refunds use the original category and cannot exceed the original amount.';

  @override
  String get unlinkedHelp => 'Add a note explaining this historical refund.';

  @override
  String get fromLocation => 'From business location';

  @override
  String get toLocation => 'To business location';

  @override
  String get transferHelp =>
      'Move money between two business-owned locations. Excluded from inflows, outflows and net cash flow.';

  @override
  String get locationHint => 'For example, cash drawer or business bank';

  @override
  String get save => 'Save entry';

  @override
  String get saving => 'Saving…';

  @override
  String get cancel => 'Cancel';

  @override
  String get delete => 'Delete entry';

  @override
  String get deleteTitle => 'Permanently delete this entry?';

  @override
  String get deleteBody =>
      'This cannot be undone. Your cash-flow totals will be updated.';

  @override
  String get confirmDelete => 'Delete permanently';

  @override
  String get back => 'Back';

  @override
  String get retry => 'Try again';

  @override
  String get saved => 'Entry saved';

  @override
  String get deleted => 'Entry deleted';

  @override
  String get sales => 'Sales';

  @override
  String get services => 'Services';

  @override
  String get supplies => 'Supplies';

  @override
  String get transport => 'Transport';

  @override
  String get rent => 'Rent';

  @override
  String get localOnly => 'Stored on this device';

  @override
  String get currency => 'Currency';

  @override
  String get currencyValue => 'Malaysian ringgit (MYR)';

  @override
  String get businessTime => 'Business dates';

  @override
  String get businessTimeValue => 'Malaysia · Asia/Kuala_Lumpur';

  @override
  String get about => 'About this preview';

  @override
  String get aboutBody =>
      'Kezuvio Labs · Create. Build. Evolve.\nMilestone 1 · Version 0.1.0\nOne ledger on one device. No login, cloud sync or automatic telemetry.';

  @override
  String get privacy => 'Data and privacy';

  @override
  String get privacyBody =>
      'Amounts, dates, categories and notes are saved in this app’s private storage. Avoid entering personal information in notes. No automatic uploads are included. Individual entries can be deleted. Backup, export and clear-all controls arrive in the next milestone.';

  @override
  String get comingNext => 'Next milestone';

  @override
  String get comingNextBody =>
      'Category management, reports, receipts, CSV export, backup and restore.';

  @override
  String get changeLanguage => 'Choose your language';

  @override
  String get errorAmount =>
      'Enter an amount from RM 0.01 to RM 9,999,999,999.99 with at most two decimal places.';

  @override
  String get errorDate => 'Enter a valid date between 1900 and 9998.';

  @override
  String get errorRefund =>
      'Choose a matching original entry and a refund date on or after it.';

  @override
  String get errorRefundLimit =>
      'This refund exceeds the amount remaining on the original entry.';

  @override
  String get errorRefundNote =>
      'Add a note explaining the refund when there is no original entry.';

  @override
  String get errorTransfer =>
      'Use two different business locations, each between 1 and 80 characters.';

  @override
  String get errorCategory =>
      'Choose an active category that matches this entry.';

  @override
  String get errorDependents =>
      'Resolve the linked refunds before deleting or making this change.';

  @override
  String get errorStale =>
      'This entry changed while you were editing. Go back and reopen it.';

  @override
  String get errorMissing =>
      'This entry no longer exists. Return to your entries.';

  @override
  String get errorDuplicate => 'This entry has already been saved.';

  @override
  String get errorAttachments =>
      'This entry has receipt data that this preview cannot delete safely.';

  @override
  String get errorInvalid => 'Check the information entered and try again.';

  @override
  String get errorStorage =>
      'Could not read or save your records. Your existing data has not been reset. Try again.';

  @override
  String get loading => 'Loading your ledger…';

  @override
  String get noteTooLong => 'Keep notes within 2,000 characters.';

  @override
  String get entryNotFound => 'Entry not found';

  @override
  String get linkedCategory => 'Category comes from the original entry.';

  @override
  String get offlineBadge => 'LOCAL · MYR';

  @override
  String get noEntries => 'No entries yet';

  @override
  String get languageSaved => 'Language updated';
}
