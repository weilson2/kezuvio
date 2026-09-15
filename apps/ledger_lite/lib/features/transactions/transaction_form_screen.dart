import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:uuid/uuid.dart';

import '../../app/providers.dart';
import '../../app/shared.dart';
import '../../core/business_date.dart';
import '../../core/money.dart';
import 'domain/ledger_transaction.dart';

class TransactionFormScreen extends ConsumerStatefulWidget {
  const TransactionFormScreen({super.key, this.entryId});
  final String? entryId;
  @override
  ConsumerState<TransactionFormScreen> createState() => _TransactionFormState();
}

class _TransactionFormState extends ConsumerState<TransactionFormScreen> {
  final form = GlobalKey<FormState>();
  final amount = TextEditingController(), note = TextEditingController();
  final from = TextEditingController(), to = TextEditingController();
  final newId = const Uuid().v4();
  late String date = businessToday();
  EntryType type = EntryType.expense;
  RefundDirection direction = RefundDirection.customerOut;
  String? categoryId, originalId;
  LedgerTransaction? originalValue;
  Object? error;
  bool loading = false, missing = false, busy = false;
  @override
  void initState() {
    super.initState();
    if (widget.entryId != null) _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
      missing = false;
    });
    try {
      final entry = await ref.read(repositoryProvider).find(widget.entryId!);
      if (!mounted) return;
      if (entry == null) {
        setState(() => missing = true);
        return;
      }
      originalValue = entry;
      amount.text = decimalSen(entry.amountSen);
      note.text = entry.note;
      from.text = entry.fromLabel ?? '';
      to.text = entry.toLabel ?? '';
      date = entry.businessDate;
      type = entry.type;
      direction = entry.refundDirection ?? RefundDirection.customerOut;
      categoryId = entry.categoryId;
      originalId = entry.originalTransactionId;
    } catch (e) {
      if (mounted) setState(() => error = e);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void dispose() {
    amount.dispose();
    note.dispose();
    from.dispose();
    to.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!form.currentState!.validate()) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final now = DateTime.now().toUtc();
      await ref
          .read(repositoryProvider)
          .save(
            LedgerTransaction(
              id: widget.entryId ?? newId,
              type: type,
              amountSen: parseSen(amount.text),
              businessDate: date,
              categoryId: type == EntryType.transfer ? null : categoryId,
              note: note.text,
              refundDirection: type == EntryType.refund ? direction : null,
              originalTransactionId: type == EntryType.refund
                  ? originalId
                  : null,
              fromLabel: type == EntryType.transfer ? from.text : null,
              toLabel: type == EntryType.transfer ? to.text : null,
              createdAt: originalValue?.createdAt ?? now,
              updatedAt: now,
              revision: originalValue?.revision ?? 0,
            ),
            isNew: widget.entryId == null,
          );
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(context.strings.saved)));
        context.go('/transactions');
      }
    } catch (e) {
      if (mounted) setState(() => error = e);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _delete() async {
    final l = context.strings;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l.deleteTitle),
        content: Text(l.deleteBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l.cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(l.confirmDelete),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await ref.read(repositoryProvider).delete(widget.entryId!);
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(context.strings.deleted)));
        context.go('/transactions');
      }
    } catch (e) {
      if (mounted) setState(() => error = e);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = context.strings;
    final cats = ref.watch(categoriesProvider),
        entries = ref.watch(transactionsProvider);
    Widget body;
    if (loading || cats.isLoading || entries.isLoading) {
      body = Center(
        child: CircularProgressIndicator(semanticsLabel: l.loading),
      );
    } else if (missing) {
      body = PageBody(
        children: [
          Text(l.entryNotFound),
          TextButton(
            onPressed: () => context.go('/transactions'),
            child: Text(l.back),
          ),
        ],
      );
    } else if (cats.hasError ||
        entries.hasError ||
        (widget.entryId != null && originalValue == null)) {
      body = LoadError(
        onRetry: () {
          ref.invalidate(categoriesProvider);
          ref.invalidate(transactionsProvider);
          if (widget.entryId != null) _load();
        },
      );
    } else {
      final expected = type == EntryType.refund
          ? (direction == RefundDirection.customerOut
                ? EntryType.income
                : EntryType.expense)
          : type;
      final categories = cats.requireValue
          .where((c) => c.kind == expected && (c.active || c.id == categoryId))
          .toList();
      final originals = entries.requireValue
          .where((e) => e.type == expected && e.id != widget.entryId)
          .toList();
      body = Form(
        key: form,
        child: PageBody(
          children: [
            DropdownButtonFormField<EntryType>(
              key: ValueKey('type-${type.name}'),
              initialValue: type,
              isExpanded: true,
              decoration: InputDecoration(labelText: l.entryType),
              items: EntryType.values
                  .map(
                    (v) => DropdownMenuItem(
                      value: v,
                      child: Text(typeLabel(l, v)),
                    ),
                  )
                  .toList(),
              onChanged: busy
                  ? null
                  : (v) {
                      if (v != null)
                        setState(() {
                          type = v;
                          categoryId = null;
                          originalId = null;
                        });
                    },
            ),
            const SizedBox(height: 20),
            TextFormField(
              key: const Key('amount-field'),
              controller: amount,
              enabled: !busy,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: InputDecoration(
                labelText: l.amount,
                helperText: l.amountHelp,
                helperMaxLines: 5,
              ),
              validator: (v) {
                try {
                  parseSen(v ?? '');
                  return null;
                } catch (_) {
                  return l.errorAmount;
                }
              },
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              key: const Key('date-field'),
              icon: const Icon(Icons.calendar_month_outlined),
              label: Text('${l.date}: $date'),
              onPressed: busy
                  ? null
                  : () async {
                      final selected = await showDatePicker(
                        context: context,
                        initialDate: parseBusinessDate(date),
                        firstDate: DateTime(1900),
                        lastDate: DateTime(9998, 12, 31),
                        helpText: l.chooseDate,
                      );
                      if (selected != null && mounted)
                        setState(() => date = dateText(selected));
                    },
            ),
            const SizedBox(height: 20),
            if (type == EntryType.refund) ...[
              DropdownButtonFormField<RefundDirection>(
                key: ValueKey(direction),
                initialValue: direction,
                isExpanded: true,
                decoration: InputDecoration(labelText: l.refundDirection),
                items: [
                  DropdownMenuItem(
                    value: RefundDirection.customerOut,
                    child: Text(l.customerRefund),
                  ),
                  DropdownMenuItem(
                    value: RefundDirection.supplierIn,
                    child: Text(l.supplierRefund),
                  ),
                ],
                onChanged: busy
                    ? null
                    : (v) {
                        if (v != null)
                          setState(() {
                            direction = v;
                            originalId = null;
                            categoryId = null;
                          });
                      },
              ),
              const SizedBox(height: 20),
              DropdownButtonFormField<String>(
                key: ValueKey('original-$originalId-$direction'),
                initialValue: originals.any((e) => e.id == originalId)
                    ? originalId!
                    : '',
                isExpanded: true,
                decoration: InputDecoration(labelText: l.refundFor),
                items: [
                  DropdownMenuItem(
                    value: '',
                    child: Text(
                      l.unlinkedRefund,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  ...originals.map(
                    (e) => DropdownMenuItem(
                      value: e.id,
                      child: Text(
                        '${e.businessDate} · ${formatMoney(BigInt.from(e.amountSen))} ${e.note}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ],
                onChanged: busy
                    ? null
                    : (v) => setState(() {
                        originalId = v == '' ? null : v;
                        categoryId = originals
                            .where((e) => e.id == originalId)
                            .firstOrNull
                            ?.categoryId;
                      }),
              ),
              const SizedBox(height: 10),
              Text(l.refundHelp),
              const SizedBox(height: 20),
            ],
            if (type != EntryType.transfer) ...[
              if (type == EntryType.refund && originalId != null)
                Text(l.linkedCategory)
              else
                DropdownButtonFormField<String>(
                  key: ValueKey('category-$categoryId-$expected'),
                  initialValue: categories.any((c) => c.id == categoryId)
                      ? categoryId!
                      : '',
                  isExpanded: true,
                  decoration: InputDecoration(labelText: l.category),
                  items: [
                    DropdownMenuItem(value: '', child: Text(l.uncategorized)),
                    ...categories.map(
                      (c) => DropdownMenuItem(
                        value: c.id,
                        child: Text(
                          categoryLabel(l, c),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ],
                  onChanged: busy
                      ? null
                      : (v) => setState(() => categoryId = v == '' ? null : v),
                ),
              const SizedBox(height: 20),
            ] else ...[
              Notice(text: l.transferHelp),
              const SizedBox(height: 20),
              TextFormField(
                key: const Key('from-field'),
                controller: from,
                enabled: !busy,
                decoration: InputDecoration(
                  labelText: l.fromLocation,
                  hintText: l.locationHint,
                ),
                maxLength: 80,
                validator: (v) =>
                    (v?.trim().isEmpty ?? true) ? l.errorTransfer : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                key: const Key('to-field'),
                controller: to,
                enabled: !busy,
                decoration: InputDecoration(
                  labelText: l.toLocation,
                  hintText: l.locationHint,
                ),
                maxLength: 80,
                validator: (v) =>
                    (v?.trim().isEmpty ?? true) ||
                        v!.trim().toLowerCase() ==
                            from.text.trim().toLowerCase()
                    ? l.errorTransfer
                    : null,
              ),
              const SizedBox(height: 20),
            ],
            TextFormField(
              key: const Key('note-field'),
              controller: note,
              enabled: !busy,
              maxLines: 3,
              maxLength: 2000,
              decoration: InputDecoration(
                labelText: l.note,
                hintText: l.noteHint,
                helperText: type == EntryType.refund && originalId == null
                    ? l.unlinkedHelp
                    : null,
                helperMaxLines: 4,
              ),
              validator: (v) =>
                  type == EntryType.refund &&
                      originalId == null &&
                      (v?.trim().isEmpty ?? true)
                  ? l.errorRefundNote
                  : null,
            ),
            const SizedBox(height: 16),
            if (error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Semantics(
                  liveRegion: true,
                  child: Text(
                    errorLabel(l, error!),
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
              ),
            FilledButton.icon(
              key: const Key('save-entry'),
              onPressed: busy ? null : _save,
              icon: const Icon(Icons.check),
              label: Text(busy ? l.saving : l.save),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: busy ? null : () => context.go('/transactions'),
              child: Text(l.cancel),
            ),
            if (widget.entryId != null) ...[
              const SizedBox(height: 24),
              TextButton.icon(
                key: const Key('delete-entry'),
                onPressed: busy ? null : _delete,
                icon: const Icon(Icons.delete_outline),
                label: Text(l.delete),
                style: TextButton.styleFrom(
                  foregroundColor: Theme.of(context).colorScheme.error,
                ),
              ),
            ],
          ],
        ),
      );
    }
    return PopScope(
      canPop: !busy,
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.entryId == null ? l.addEntry : l.editEntry),
          leading: IconButton(
            tooltip: l.back,
            onPressed: busy ? null : () => context.go('/transactions'),
            icon: const Icon(Icons.arrow_back),
          ),
        ),
        body: SafeArea(top: false, child: body),
      ),
    );
  }
}
