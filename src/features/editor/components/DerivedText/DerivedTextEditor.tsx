import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { Dialog, DialogContent } from '../../../../components/ui/Dialog/Dialog';
import { ConditionListEditor } from '../RuleEditor/ConditionListEditor';
import { resolveOutcome, hasFallback } from '../../../../domain/DerivedText/resolveDerivedText';
import type { DerivedText, DerivedTextOutcome } from '../../../../domain/DerivedText/DerivedText';
import styles from './DerivedText.module.css';

export interface DerivedTextEditorProps {
  derived: DerivedText;
  onClose: () => void;
}

const newOutcome = (): DerivedTextOutcome => ({
  id: `dto-${crypto.randomUUID().slice(0, 8)}`,
  text: '',
  condition: [],
});

/**
 * The ordered list of outcomes.
 *
 * Order is the semantics — the first outcome whose condition holds wins — so the
 * list is explicitly ordered rather than sorted, and the badge says which one
 * resolves under the starting values. Up/down rather than the design's drag
 * handles, matching the rule rows and status entries, and working from a keyboard.
 */
export const DerivedTextEditor: React.FC<DerivedTextEditorProps> = ({ derived, onClose }) => {
  const { variables, updateDerivedText } = useEditorStore(
    useShallow((state) => ({
      variables: state.variables,
      updateDerivedText: state.updateDerivedText,
    }))
  );

  const resolvedId = useMemo(() => {
    const context = {
      variables: (variables ?? {}) as unknown as Record<string, unknown>,
      visitedPageIds: [],
      currentPageId: '',
      inventory: {},
    };
    return resolveOutcome(derived, context)?.id;
  }, [derived, variables]);

  const setOutcomes = (outcomes: DerivedTextOutcome[]) => updateDerivedText(derived.id, { outcomes });

  const patch = (id: string, updates: Partial<DerivedTextOutcome>) =>
    setOutcomes(derived.outcomes.map((outcome) => (outcome.id === id ? { ...outcome, ...updates } : outcome)));

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= derived.outcomes.length) return;
    const next = [...derived.outcomes];
    [next[index], next[target]] = [next[target], next[index]];
    setOutcomes(next);
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent title="Derived text" description="Returns the first line whose condition holds." width={640}>
        <div className={styles.outcomes}>
          {derived.outcomes.length === 0 && (
            <p className={styles.noOutcomes}>Nothing yet. Add what this could say.</p>
          )}

          {derived.outcomes.map((outcome, index) => (
            <section key={outcome.id} className={styles.outcome} data-resolves={outcome.id === resolvedId || undefined}>
              <div className={styles.outcomeHead}>
                <input
                  className={styles.outcomeText}
                  value={outcome.text}
                  aria-label={`Outcome ${index + 1} text`}
                  placeholder="what the sentence says…"
                  onChange={(event) => patch(outcome.id, { text: event.target.value })}
                />

                {outcome.id === resolvedId && <span className={styles.resolves}>resolves now</span>}

                <span className={styles.outcomeControls}>
                  <button
                    type="button"
                    className={styles.control}
                    disabled={index === 0}
                    aria-label={`Move outcome ${index + 1} up`}
                    onClick={() => move(index, -1)}
                  >
                    <ChevronUp className={styles.controlIcon} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.control}
                    disabled={index === derived.outcomes.length - 1}
                    aria-label={`Move outcome ${index + 1} down`}
                    onClick={() => move(index, 1)}
                  >
                    <ChevronDown className={styles.controlIcon} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.control}
                    aria-label={`Remove outcome ${index + 1}`}
                    onClick={() => setOutcomes(derived.outcomes.filter((entry) => entry.id !== outcome.id))}
                  >
                    <X className={styles.controlIcon} aria-hidden="true" />
                  </button>
                </span>
              </div>

              <div className={styles.outcomeCondition}>
                <ConditionListEditor
                  condition={outcome.condition ?? []}
                  emptyLabel="otherwise — the fallback"
                  addLabel="Only when…"
                  onChange={(condition) => patch(outcome.id, { condition })}
                />
              </div>
            </section>
          ))}
        </div>

        <footer className={styles.footer}>
          <button
            type="button"
            className={styles.addOutcome}
            onClick={() => setOutcomes([...derived.outcomes, newOutcome()])}
          >
            <Plus className={styles.addIcon} aria-hidden="true" />
            Add an outcome
          </button>

          <p className={styles.hint}>
            {hasFallback(derived)
              ? 'The first match wins — order matters.'
              : 'Every outcome has a condition, so this can resolve to nothing. Leave the last one unconditional to be safe.'}
          </p>
        </footer>
      </DialogContent>
    </Dialog>
  );
};
