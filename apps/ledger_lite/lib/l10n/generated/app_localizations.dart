import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('zh'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Ledger Lite'**
  String get appTitle;

  /// No description provided for @dashboard.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get dashboard;

  /// No description provided for @transactions.
  ///
  /// In en, this message translates to:
  /// **'Entries'**
  String get transactions;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @welcomeTitle.
  ///
  /// In en, this message translates to:
  /// **'A clearer view of your business.'**
  String get welcomeTitle;

  /// No description provided for @welcomeSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Record money in and out. Keep your day simple.'**
  String get welcomeSubtitle;

  /// No description provided for @localTitle.
  ///
  /// In en, this message translates to:
  /// **'Your records, on this device'**
  String get localTitle;

  /// No description provided for @localDisclosure.
  ///
  /// In en, this message translates to:
  /// **'Records stay in this app on this device. No account or automatic upload. Losing or uninstalling the app can lose your records.'**
  String get localDisclosure;

  /// No description provided for @developmentNotice.
  ///
  /// In en, this message translates to:
  /// **'Development preview · Use sample data only. Backup and export are not available yet.'**
  String get developmentNotice;

  /// No description provided for @start.
  ///
  /// In en, this message translates to:
  /// **'Start my ledger'**
  String get start;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @chinese.
  ///
  /// In en, this message translates to:
  /// **'简体中文'**
  String get chinese;

  /// No description provided for @thisMonth.
  ///
  /// In en, this message translates to:
  /// **'This month'**
  String get thisMonth;

  /// No description provided for @monthSubtitle.
  ///
  /// In en, this message translates to:
  /// **'A simple picture of money moving through your business.'**
  String get monthSubtitle;

  /// No description provided for @inflows.
  ///
  /// In en, this message translates to:
  /// **'Inflows'**
  String get inflows;

  /// No description provided for @outflows.
  ///
  /// In en, this message translates to:
  /// **'Outflows'**
  String get outflows;

  /// No description provided for @netCashFlow.
  ///
  /// In en, this message translates to:
  /// **'Net cash flow'**
  String get netCashFlow;

  /// No description provided for @cashFlowHelp.
  ///
  /// In en, this message translates to:
  /// **'Money received minus money paid. This is not an accounting or tax profit report.'**
  String get cashFlowHelp;

  /// No description provided for @addEntry.
  ///
  /// In en, this message translates to:
  /// **'Add an entry'**
  String get addEntry;

  /// No description provided for @editEntry.
  ///
  /// In en, this message translates to:
  /// **'Edit entry'**
  String get editEntry;

  /// No description provided for @recentEntries.
  ///
  /// In en, this message translates to:
  /// **'Recent entries'**
  String get recentEntries;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View all'**
  String get viewAll;

  /// No description provided for @emptyTitle.
  ///
  /// In en, this message translates to:
  /// **'Your ledger starts here'**
  String get emptyTitle;

  /// No description provided for @emptyBody.
  ///
  /// In en, this message translates to:
  /// **'Add your first income or expense to see your monthly cash flow.'**
  String get emptyBody;

  /// No description provided for @allEntries.
  ///
  /// In en, this message translates to:
  /// **'Your entries'**
  String get allEntries;

  /// No description provided for @entryType.
  ///
  /// In en, this message translates to:
  /// **'Entry type'**
  String get entryType;

  /// No description provided for @income.
  ///
  /// In en, this message translates to:
  /// **'Income'**
  String get income;

  /// No description provided for @expense.
  ///
  /// In en, this message translates to:
  /// **'Expense'**
  String get expense;

  /// No description provided for @refund.
  ///
  /// In en, this message translates to:
  /// **'Refund'**
  String get refund;

  /// No description provided for @transfer.
  ///
  /// In en, this message translates to:
  /// **'Internal transfer'**
  String get transfer;

  /// No description provided for @amount.
  ///
  /// In en, this message translates to:
  /// **'Amount (RM)'**
  String get amount;

  /// No description provided for @amountHelp.
  ///
  /// In en, this message translates to:
  /// **'For example, 18.50. Enter a positive amount with up to two decimal places.'**
  String get amountHelp;

  /// No description provided for @date.
  ///
  /// In en, this message translates to:
  /// **'Transaction date'**
  String get date;

  /// No description provided for @chooseDate.
  ///
  /// In en, this message translates to:
  /// **'Choose date'**
  String get chooseDate;

  /// No description provided for @category.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// No description provided for @uncategorized.
  ///
  /// In en, this message translates to:
  /// **'Uncategorized'**
  String get uncategorized;

  /// No description provided for @note.
  ///
  /// In en, this message translates to:
  /// **'Note'**
  String get note;

  /// No description provided for @noteHint.
  ///
  /// In en, this message translates to:
  /// **'What was this for?'**
  String get noteHint;

  /// No description provided for @refundDirection.
  ///
  /// In en, this message translates to:
  /// **'Refund direction'**
  String get refundDirection;

  /// No description provided for @customerRefund.
  ///
  /// In en, this message translates to:
  /// **'Refund to a customer'**
  String get customerRefund;

  /// No description provided for @supplierRefund.
  ///
  /// In en, this message translates to:
  /// **'Refund from a supplier'**
  String get supplierRefund;

  /// No description provided for @refundFor.
  ///
  /// In en, this message translates to:
  /// **'Original entry'**
  String get refundFor;

  /// No description provided for @unlinkedRefund.
  ///
  /// In en, this message translates to:
  /// **'No original entry in this ledger'**
  String get unlinkedRefund;

  /// No description provided for @refundHelp.
  ///
  /// In en, this message translates to:
  /// **'Linked refunds use the original category and cannot exceed the original amount.'**
  String get refundHelp;

  /// No description provided for @unlinkedHelp.
  ///
  /// In en, this message translates to:
  /// **'Add a note explaining this historical refund.'**
  String get unlinkedHelp;

  /// No description provided for @fromLocation.
  ///
  /// In en, this message translates to:
  /// **'From business location'**
  String get fromLocation;

  /// No description provided for @toLocation.
  ///
  /// In en, this message translates to:
  /// **'To business location'**
  String get toLocation;

  /// No description provided for @transferHelp.
  ///
  /// In en, this message translates to:
  /// **'Move money between two business-owned locations. Excluded from inflows, outflows and net cash flow.'**
  String get transferHelp;

  /// No description provided for @locationHint.
  ///
  /// In en, this message translates to:
  /// **'For example, cash drawer or business bank'**
  String get locationHint;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save entry'**
  String get save;

  /// No description provided for @saving.
  ///
  /// In en, this message translates to:
  /// **'Saving…'**
  String get saving;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete entry'**
  String get delete;

  /// No description provided for @deleteTitle.
  ///
  /// In en, this message translates to:
  /// **'Permanently delete this entry?'**
  String get deleteTitle;

  /// No description provided for @deleteBody.
  ///
  /// In en, this message translates to:
  /// **'This cannot be undone. Your cash-flow totals will be updated.'**
  String get deleteBody;

  /// No description provided for @confirmDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete permanently'**
  String get confirmDelete;

  /// No description provided for @back.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get retry;

  /// No description provided for @saved.
  ///
  /// In en, this message translates to:
  /// **'Entry saved'**
  String get saved;

  /// No description provided for @deleted.
  ///
  /// In en, this message translates to:
  /// **'Entry deleted'**
  String get deleted;

  /// No description provided for @sales.
  ///
  /// In en, this message translates to:
  /// **'Sales'**
  String get sales;

  /// No description provided for @services.
  ///
  /// In en, this message translates to:
  /// **'Services'**
  String get services;

  /// No description provided for @supplies.
  ///
  /// In en, this message translates to:
  /// **'Supplies'**
  String get supplies;

  /// No description provided for @transport.
  ///
  /// In en, this message translates to:
  /// **'Transport'**
  String get transport;

  /// No description provided for @rent.
  ///
  /// In en, this message translates to:
  /// **'Rent'**
  String get rent;

  /// No description provided for @localOnly.
  ///
  /// In en, this message translates to:
  /// **'Stored on this device'**
  String get localOnly;

  /// No description provided for @currency.
  ///
  /// In en, this message translates to:
  /// **'Currency'**
  String get currency;

  /// No description provided for @currencyValue.
  ///
  /// In en, this message translates to:
  /// **'Malaysian ringgit (MYR)'**
  String get currencyValue;

  /// No description provided for @businessTime.
  ///
  /// In en, this message translates to:
  /// **'Business dates'**
  String get businessTime;

  /// No description provided for @businessTimeValue.
  ///
  /// In en, this message translates to:
  /// **'Malaysia · Asia/Kuala_Lumpur'**
  String get businessTimeValue;

  /// No description provided for @about.
  ///
  /// In en, this message translates to:
  /// **'About this preview'**
  String get about;

  /// No description provided for @aboutBody.
  ///
  /// In en, this message translates to:
  /// **'Kezuvio Labs · Create. Build. Evolve.\nMilestone 1 · Version 0.1.0\nOne ledger on one device. No login, cloud sync or automatic telemetry.'**
  String get aboutBody;

  /// No description provided for @privacy.
  ///
  /// In en, this message translates to:
  /// **'Data and privacy'**
  String get privacy;

  /// No description provided for @privacyBody.
  ///
  /// In en, this message translates to:
  /// **'Amounts, dates, categories and notes are saved in this app’s private storage. Avoid entering personal information in notes. No automatic uploads are included. Individual entries can be deleted. Backup, export and clear-all controls arrive in the next milestone.'**
  String get privacyBody;

  /// No description provided for @comingNext.
  ///
  /// In en, this message translates to:
  /// **'Next milestone'**
  String get comingNext;

  /// No description provided for @comingNextBody.
  ///
  /// In en, this message translates to:
  /// **'Category management, reports, receipts, CSV export, backup and restore.'**
  String get comingNextBody;

  /// No description provided for @changeLanguage.
  ///
  /// In en, this message translates to:
  /// **'Choose your language'**
  String get changeLanguage;

  /// No description provided for @errorAmount.
  ///
  /// In en, this message translates to:
  /// **'Enter an amount from RM 0.01 to RM 9,999,999,999.99 with at most two decimal places.'**
  String get errorAmount;

  /// No description provided for @errorDate.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid date between 1900 and 9998.'**
  String get errorDate;

  /// No description provided for @errorRefund.
  ///
  /// In en, this message translates to:
  /// **'Choose a matching original entry and a refund date on or after it.'**
  String get errorRefund;

  /// No description provided for @errorRefundLimit.
  ///
  /// In en, this message translates to:
  /// **'This refund exceeds the amount remaining on the original entry.'**
  String get errorRefundLimit;

  /// No description provided for @errorRefundNote.
  ///
  /// In en, this message translates to:
  /// **'Add a note explaining the refund when there is no original entry.'**
  String get errorRefundNote;

  /// No description provided for @errorTransfer.
  ///
  /// In en, this message translates to:
  /// **'Use two different business locations, each between 1 and 80 characters.'**
  String get errorTransfer;

  /// No description provided for @errorCategory.
  ///
  /// In en, this message translates to:
  /// **'Choose an active category that matches this entry.'**
  String get errorCategory;

  /// No description provided for @errorDependents.
  ///
  /// In en, this message translates to:
  /// **'Resolve the linked refunds before deleting or making this change.'**
  String get errorDependents;

  /// No description provided for @errorStale.
  ///
  /// In en, this message translates to:
  /// **'This entry changed while you were editing. Go back and reopen it.'**
  String get errorStale;

  /// No description provided for @errorMissing.
  ///
  /// In en, this message translates to:
  /// **'This entry no longer exists. Return to your entries.'**
  String get errorMissing;

  /// No description provided for @errorDuplicate.
  ///
  /// In en, this message translates to:
  /// **'This entry has already been saved.'**
  String get errorDuplicate;

  /// No description provided for @errorAttachments.
  ///
  /// In en, this message translates to:
  /// **'This entry has receipt data that this preview cannot delete safely.'**
  String get errorAttachments;

  /// No description provided for @errorInvalid.
  ///
  /// In en, this message translates to:
  /// **'Check the information entered and try again.'**
  String get errorInvalid;

  /// No description provided for @errorStorage.
  ///
  /// In en, this message translates to:
  /// **'Could not read or save your records. Your existing data has not been reset. Try again.'**
  String get errorStorage;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading your ledger…'**
  String get loading;

  /// No description provided for @noteTooLong.
  ///
  /// In en, this message translates to:
  /// **'Keep notes within 2,000 characters.'**
  String get noteTooLong;

  /// No description provided for @entryNotFound.
  ///
  /// In en, this message translates to:
  /// **'Entry not found'**
  String get entryNotFound;

  /// No description provided for @linkedCategory.
  ///
  /// In en, this message translates to:
  /// **'Category comes from the original entry.'**
  String get linkedCategory;

  /// No description provided for @offlineBadge.
  ///
  /// In en, this message translates to:
  /// **'LOCAL · MYR'**
  String get offlineBadge;

  /// No description provided for @noEntries.
  ///
  /// In en, this message translates to:
  /// **'No entries yet'**
  String get noEntries;

  /// No description provided for @languageSaved.
  ///
  /// In en, this message translates to:
  /// **'Language updated'**
  String get languageSaved;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
