// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => 'Ledger Lite';

  @override
  String get dashboard => '概览';

  @override
  String get transactions => '收支';

  @override
  String get settings => '设置';

  @override
  String get welcomeTitle => '生意收支，一目了然。';

  @override
  String get welcomeSubtitle => '记录每笔收入与支出，让日常管理更轻松。';

  @override
  String get localTitle => '账目保存在此设备上';

  @override
  String get localDisclosure => '记录仅保存在此设备的应用内，无需账号，也不会自动上传。设备丢失或卸载应用可能导致记录丢失。';

  @override
  String get developmentNotice => '开发预览版 · 请仅使用示例数据。备份和导出功能尚未提供。';

  @override
  String get start => '开始记账';

  @override
  String get language => '语言';

  @override
  String get english => 'English';

  @override
  String get chinese => '简体中文';

  @override
  String get thisMonth => '本月收支';

  @override
  String get monthSubtitle => '清楚了解每一笔流入和流出的资金。';

  @override
  String get inflows => '资金流入';

  @override
  String get outflows => '资金流出';

  @override
  String get netCashFlow => '净现金流';

  @override
  String get cashFlowHelp => '实际收到的资金减去实际支付的资金。这不是会计或税务利润报表。';

  @override
  String get addEntry => '新增记录';

  @override
  String get editEntry => '编辑记录';

  @override
  String get recentEntries => '最近记录';

  @override
  String get viewAll => '查看全部';

  @override
  String get emptyTitle => '从第一笔记录开始';

  @override
  String get emptyBody => '添加收入或支出，即可查看本月现金流。';

  @override
  String get allEntries => '收支记录';

  @override
  String get entryType => '记录类型';

  @override
  String get income => '收入';

  @override
  String get expense => '支出';

  @override
  String get refund => '退款';

  @override
  String get transfer => '内部转账';

  @override
  String get amount => '金额（RM）';

  @override
  String get amountHelp => '例如 18.50。请输入正数，最多保留两位小数。';

  @override
  String get date => '交易日期';

  @override
  String get chooseDate => '选择日期';

  @override
  String get category => '分类';

  @override
  String get uncategorized => '未分类';

  @override
  String get note => '备注';

  @override
  String get noteHint => '这笔款项用于什么？';

  @override
  String get refundDirection => '退款方向';

  @override
  String get customerRefund => '退还给客户';

  @override
  String get supplierRefund => '供应商退回';

  @override
  String get refundFor => '原始记录';

  @override
  String get unlinkedRefund => '账本中没有原始记录';

  @override
  String get refundHelp => '关联退款使用原始记录的分类，累计退款不能超过原金额。';

  @override
  String get unlinkedHelp => '请备注说明这笔历史退款。';

  @override
  String get fromLocation => '转出位置';

  @override
  String get toLocation => '转入位置';

  @override
  String get transferHelp => '仅记录企业自有资金位置之间的转移，不计入资金流入、流出或净现金流。';

  @override
  String get locationHint => '例如现金抽屉或企业银行账户';

  @override
  String get save => '保存记录';

  @override
  String get saving => '正在保存…';

  @override
  String get cancel => '取消';

  @override
  String get delete => '删除记录';

  @override
  String get deleteTitle => '永久删除这笔记录？';

  @override
  String get deleteBody => '此操作无法撤销。现金流汇总将随之更新。';

  @override
  String get confirmDelete => '永久删除';

  @override
  String get back => '返回';

  @override
  String get retry => '重试';

  @override
  String get saved => '记录已保存';

  @override
  String get deleted => '记录已删除';

  @override
  String get sales => '销售';

  @override
  String get services => '服务';

  @override
  String get supplies => '用品';

  @override
  String get transport => '交通';

  @override
  String get rent => '租金';

  @override
  String get localOnly => '保存在此设备上';

  @override
  String get currency => '货币';

  @override
  String get currencyValue => '马来西亚令吉（MYR）';

  @override
  String get businessTime => '记账日期';

  @override
  String get businessTimeValue => '马来西亚 · Asia/Kuala_Lumpur';

  @override
  String get about => '关于此预览版';

  @override
  String get aboutBody =>
      'Kezuvio Labs · Create. Build. Evolve.\n里程碑 1 · 版本 0.1.0\n一个设备、一个账本。无需登录，无云端同步，也无自动遥测。';

  @override
  String get privacy => '数据与隐私';

  @override
  String get privacyBody =>
      '金额、日期、分类和备注保存在应用私有存储中。请避免在备注中输入个人信息。本应用不会自动上传记录。可删除单笔记录；备份、导出及清空全部数据功能将在下一里程碑提供。';

  @override
  String get comingNext => '下一里程碑';

  @override
  String get comingNextBody => '分类管理、报表、收据、CSV 导出、备份与恢复。';

  @override
  String get changeLanguage => '选择语言';

  @override
  String get errorAmount => '请输入 RM 0.01 至 RM 9,999,999,999.99 之间的金额，最多两位小数。';

  @override
  String get errorDate => '请输入 1900 至 9998 年之间的有效日期。';

  @override
  String get errorRefund => '请选择匹配的原始记录，退款日期不能早于原始日期。';

  @override
  String get errorRefundLimit => '此退款超出了原始记录的可退金额。';

  @override
  String get errorRefundNote => '没有原始记录时，请填写备注说明退款原因。';

  @override
  String get errorTransfer => '请填写两个不同的企业资金位置，各为 1 至 80 个字符。';

  @override
  String get errorCategory => '请选择与记录类型匹配的有效分类。';

  @override
  String get errorDependents => '请先处理关联退款，再删除或进行此修改。';

  @override
  String get errorStale => '编辑期间记录已更改。请返回并重新打开。';

  @override
  String get errorMissing => '此记录已不存在，请返回收支列表。';

  @override
  String get errorDuplicate => '此记录已保存。';

  @override
  String get errorAttachments => '此记录包含收据数据，此预览版无法安全删除。';

  @override
  String get errorInvalid => '请检查输入的信息后重试。';

  @override
  String get errorStorage => '无法读取或保存记录。现有数据未被重置，请重试。';

  @override
  String get loading => '正在载入账本…';

  @override
  String get noteTooLong => '备注不能超过 2,000 个字符。';

  @override
  String get entryNotFound => '找不到记录';

  @override
  String get linkedCategory => '分类沿用原始记录。';

  @override
  String get offlineBadge => '本地 · MYR';

  @override
  String get noEntries => '暂无记录';

  @override
  String get languageSaved => '语言已更新';
}
