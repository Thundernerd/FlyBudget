import { previewRules } from '../../api/rules';
import { useApplyRules } from '../../hooks/useRules';
import type { RuleApplyScope } from '../../types';
import { ApplyChangesModal } from './ApplyChangesModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Run just these rules; omit to run every enabled rule */
  ruleIds?: string[];
  initialScope?: RuleApplyScope;
  title: string;
}

export function ApplyRulesModal({ isOpen, onClose, ruleIds, initialScope, title }: Props) {
  const apply = useApplyRules();

  return (
    <ApplyChangesModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      initialScope={initialScope}
      scopeControl="toggle"
      queryKey={['rules', 'preview', ruleIds ?? 'all']}
      preview={(scope) => previewRules({ ruleIds, scope })}
      apply={(target, options) => apply.mutate({ ruleIds, ...target }, options)}
      applying={apply.isPending}
    />
  );
}
