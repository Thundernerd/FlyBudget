import { useEffect, useMemo, useState } from 'react';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useCanSave } from '../../hooks/useConnection';
import { SavingPausedHint } from '../connection/SavingPausedHint';
import { useRuleLookups } from './useRuleLookups';
import { formatCurrency } from '../../utils/currency';
import type { RuleApplyScope, RulePreviewItem } from '../../types';
import { formatDay } from '../../utils/dates';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialScope?: RuleApplyScope;
  scopeControl: 'toggle' | 'skip-categorized';
  queryKey: QueryKey;
  preview: (scope: RuleApplyScope) => Promise<RulePreviewItem[]>;
  apply: (
    target: { scope: RuleApplyScope; transactionIds: string[] },
    options: { onSuccess: (result: { updated: number }) => void },
  ) => void;
  applying: boolean;
}

const SCOPES: Array<{ value: RuleApplyScope; label: string }> = [
  { value: 'uncategorized', label: 'Uncategorized only' },
  { value: 'all', label: 'All transactions' },
];

export function ApplyChangesModal({
  isOpen,
  onClose,
  title,
  initialScope = 'uncategorized',
  scopeControl,
  queryKey,
  preview,
  apply,
  applying,
}: Props) {
  const [scope, setScope] = useState<RuleApplyScope>(initialScope);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<number | null>(null);
  const canSave = useCanSave();
  const { lookups } = useRuleLookups();

  const { data: items, isLoading } = useQuery({
    queryKey: [...queryKey, scope],
    queryFn: () => preview(scope),
    enabled: isOpen && done === null,
    staleTime: 0,
    gcTime: 0,
  });
  useEffect(() => setExcluded(new Set()), [scope]);

  const selected = useMemo(
    () => (items ?? []).filter((i) => !excluded.has(i.transactionId)),
    [items, excluded],
  );
  const allOn = !!items?.length && excluded.size === 0;

  function toggle(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleApply() {
    apply(
      { scope, transactionIds: selected.map((i) => i.transactionId) },
      { onSuccess: (res) => setDone(res.updated) },
    );
  }

  const category = (id: string | null) =>
    id ? (lookups.category(id) ?? '(deleted)') : 'Uncategorized';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      {done !== null ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary py-4 text-center">
            Updated <span className="font-semibold text-text">{done.toLocaleString()}</span>{' '}
            transaction
            {done === 1 ? '' : 's'}.
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {scopeControl === 'toggle' ? (
              <div
                className="flex rounded-lg border border-border overflow-hidden"
                role="radiogroup"
                aria-label="Which transactions"
              >
                {SCOPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={scope === s.value}
                    onClick={() => setScope(s.value)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                      scope === s.value
                        ? 'bg-brand-50 text-brand-700'
                        : 'bg-surface text-text-secondary hover:bg-hover'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : (
              <label className="flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer max-md:min-h-11">
                <input
                  type="checkbox"
                  checked={scope === 'uncategorized'}
                  onChange={(e) => setScope(e.target.checked ? 'uncategorized' : 'all')}
                  className="accent-brand-600"
                />
                Skip transactions that already have a category
              </label>
            )}
            <p className="text-xs text-text-tertiary">
              Reconciled, transfer, split and balance adjustment transactions are never changed.
            </p>
          </div>

          {isLoading || !items ? (
            <p className="text-sm text-text-tertiary py-8 text-center">Checking transactions…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-text-secondary py-8 text-center">
              Nothing to change: no {scope === 'uncategorized' ? 'uncategorized ' : ''}transactions
              would be updated.
            </p>
          ) : (
            <div className="rounded-lg border border-border-light overflow-hidden">
              <div className="max-h-[50vh] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface-alt border-b border-border-light">
                    <tr className="text-left text-text-tertiary">
                      <th className="w-8 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={allOn}
                          onChange={() =>
                            setExcluded(
                              allOn ? new Set(items.map((i) => i.transactionId)) : new Set(),
                            )
                          }
                          className="accent-brand-600"
                          aria-label="Select all"
                        />
                      </th>
                      <th className="px-2 py-2 font-medium">Date</th>
                      <th className="px-2 py-2 font-medium">Payee</th>
                      <th className="px-2 py-2 font-medium text-right">Amount</th>
                      <th className="px-3 py-2 font-medium">Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {items.map((item) => (
                      <tr
                        key={item.transactionId}
                        onClick={() => toggle(item.transactionId)}
                        className={`cursor-pointer hover:bg-hover ${excluded.has(item.transactionId) ? 'opacity-50' : ''}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={!excluded.has(item.transactionId)}
                            onChange={() => toggle(item.transactionId)}
                            onClick={(e) => e.stopPropagation()}
                            className="accent-brand-600"
                            aria-label="Include this transaction"
                          />
                        </td>
                        <td className="px-2 py-2 text-text-tertiary whitespace-nowrap">
                          {formatDay(item.date)}
                        </td>
                        <td className="px-2 py-2 text-text max-w-40 truncate">
                          {item.payeeName ?? '—'}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums text-text whitespace-nowrap">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-3 py-2">
                          <Changes item={item} category={category} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <SavingPausedHint />
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={!selected.length || applying || !canSave}>
              {applying
                ? 'Applying…'
                : `Apply to ${selected.length.toLocaleString()} transaction${selected.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Change({ label, from, to }: { label: string; from: string; to: string }) {
  return (
    <div className="flex items-center gap-1 min-w-0">
      <span className="text-text-tertiary shrink-0">{label}</span>
      <span className="truncate text-text-secondary line-through decoration-text-disabled">
        {from}
      </span>
      <ArrowRight size={11} className="shrink-0 text-text-tertiary" />
      <span className="truncate font-medium text-text">{to}</span>
    </div>
  );
}

function Changes({
  item,
  category,
}: {
  item: RulePreviewItem;
  category: (id: string | null) => string;
}) {
  const { payee, category: cat, notes, split } = item.changes;
  const blank = (s: string | null) => s || '(empty)';
  return (
    <div className="space-y-0.5 max-w-80">
      {payee && <Change label="Payee" from={blank(payee.from)} to={blank(payee.to)} />}
      {cat && <Change label="Category" from={category(cat.from)} to={category(cat.to)} />}
      {notes && <Change label="Notes" from={blank(notes.from)} to={blank(notes.to)} />}
      {split && (
        <div className="text-text">
          <span className="text-text-tertiary">Split </span>
          {split.map((s) => `${formatCurrency(s.amount)} ${category(s.categoryId)}`).join(' · ')}
        </div>
      )}
    </div>
  );
}
