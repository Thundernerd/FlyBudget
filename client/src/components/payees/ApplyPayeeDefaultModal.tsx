import { previewPayeeDefault } from '../../api/payees';
import { useApplyPayeeDefault } from '../../hooks/usePayees';
import type { PayeeWithCount } from '../../types';
import { ApplyChangesModal } from '../rules/ApplyChangesModal';
import { useRuleLookups } from '../rules/useRuleLookups';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  payee: PayeeWithCount;
}

export function ApplyPayeeDefaultModal({ isOpen, onClose, payee }: Props) {
  const apply = useApplyPayeeDefault();
  const { lookups } = useRuleLookups();
  const category = lookups.category(payee.defaultCategoryId ?? '') ?? 'default category';

  return (
    <ApplyChangesModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply "${category}" to ${payee.name}`}
      scopeControl="skip-categorized"
      queryKey={['payee-default-preview', payee.id, payee.defaultCategoryId]}
      preview={(scope) => previewPayeeDefault(payee.id, scope)}
      apply={(target, options) => apply.mutate({ id: payee.id, ...target }, options)}
      applying={apply.isPending}
    />
  );
}
