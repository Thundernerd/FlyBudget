import { apiFetch } from './client';
import type { PayeeWithCount, RuleApplyScope, RulePreviewItem } from '../types';

export const getPayees = () => apiFetch<PayeeWithCount[]>('/payees');
export const createPayee = (name: string, defaultCategoryId?: string | null) =>
  apiFetch<PayeeWithCount>('/payees', {
    method: 'POST',
    body: JSON.stringify({ name, defaultCategoryId }),
  });
export const updatePayee = (
  id: string,
  data: { name?: string; defaultCategoryId?: string | null; logo?: string | null },
) => apiFetch<PayeeWithCount>(`/payees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePayee = (id: string) => apiFetch<void>(`/payees/${id}`, { method: 'DELETE' });
export const mergePayees = (keepId: string, mergeIds: string[]) =>
  apiFetch<{ merged: number }>('/payees/merge', {
    method: 'POST',
    body: JSON.stringify({ keepId, mergeIds }),
  });
export const previewPayeeDefault = (id: string, scope: RuleApplyScope) =>
  apiFetch<RulePreviewItem[]>(`/payees/${id}/default-category/preview`, {
    method: 'POST',
    body: JSON.stringify({ scope }),
  });
export const applyPayeeDefault = (
  id: string,
  target: { scope: RuleApplyScope; transactionIds: string[] },
) =>
  apiFetch<{ updated: number }>(`/payees/${id}/default-category/apply`, {
    method: 'POST',
    body: JSON.stringify(target),
  });
