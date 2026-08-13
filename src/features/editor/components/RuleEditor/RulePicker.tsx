import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent } from '../../../../components/ui/Dialog/Dialog';
import { useBlueprintUsage } from '../../hooks/data/useBlueprintUsage';
import {
  BLUEPRINT_CATEGORIES,
  CATEGORY_LABELS,
  type BlueprintCategory,
} from '../../../../domain/Blueprints/BlueprintCategory';
import { countByCategory, filterRuleOptions, ruleOptions, type RuleOption } from './rulePickerOptions';
import styles from './RulePicker.module.css';

export interface RulePickerProps {
  /** Where the chosen rule will go, for the footer's hint. */
  destination: string;
  /**
   * Narrows what can be picked. Status-data visibility and derived-text outcomes
   * ask a question rather than doing something, so offering them actions would
   * offer something the evaluator would never run.
   */
  only?: RuleOption['kind'];
  onCancel: () => void;
  onPick: (option: RuleOption) => void;
}

const ALL = 'all' as const;
type Selection = BlueprintCategory | typeof ALL;

/**
 * Choosing a rule to insert.
 *
 * A query row, a category rail with counts, and results grouped by category —
 * each row showing the sentence it will become, then the blueprint's name and how
 * often this story already uses it.
 */
export const RulePicker: React.FC<RulePickerProps> = ({ destination, only, onCancel, onPick }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Selection>(ALL);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastKey, setLastKey] = useState(`${query}|${category}`);

  const usage = useBlueprintUsage();
  const all = useMemo(
    () => (only ? ruleOptions().filter((option) => option.kind === only) : ruleOptions()),
    [only]
  );

  const matching = useMemo(() => filterRuleOptions(all, query), [all, query]);
  const counts = useMemo(() => countByCategory(matching), [matching]);
  const shown = useMemo(
    () => (category === ALL ? matching : matching.filter((option) => option.category === category)),
    [matching, category]
  );

  const key = `${query}|${category}`;
  if (key !== lastKey) {
    // A new query or category means a new result set; the highlight goes to the top.
    setLastKey(key);
    setActiveIndex(0);
  }
  const highlighted = Math.min(activeIndex, Math.max(0, shown.length - 1));

  const grouped = useMemo(() => {
    const byCategory = new Map<BlueprintCategory, RuleOption[]>();
    for (const option of shown) {
      const bucket = byCategory.get(option.category);
      if (bucket) bucket.push(option);
      else byCategory.set(option.category, [option]);
    }
    return BLUEPRINT_CATEGORIES.filter((entry) => byCategory.has(entry)).map((entry) => ({
      category: entry,
      options: byCategory.get(entry)!,
    }));
  }, [shown]);

  const railCategories: Selection[] = [ALL, ...BLUEPRINT_CATEGORIES];

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (shown.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => (current + step + shown.length) % shown.length);
      return;
    }

    if (event.key === 'Tab') {
      // ⇥ walks the category rail, as the footer promises.
      event.preventDefault();
      const index = railCategories.indexOf(category);
      const next = (index + (event.shiftKey ? -1 : 1) + railCategories.length) % railCategories.length;
      setCategory(railCategories[next]);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const option = shown[highlighted];
      if (option) onPick(option);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onCancel())}>
      <DialogContent
        title={only === 'condition' ? 'Add a condition' : 'Add a rule'}
        hideTitle
        showCloseButton={false}
        padded={false}
        width={640}
        className={styles.panel}
      >
        <div className={styles.picker} onKeyDown={handleKeyDown}>
          <div className={styles.queryRow}>
            <span className={styles.prompt} aria-hidden="true">
              ›
            </span>
            <input
              className={styles.input}
              value={query}
              autoFocus
              aria-label="Search rules"
              placeholder="Search rules…"
              onChange={(event) => setQuery(event.target.value)}
            />
            <span className={styles.escHint}>esc</span>
          </div>

          <div className={styles.body}>
            <nav className={styles.rail} aria-label="Categories">
              <h3 className={styles.railHeading}>Categories</h3>
              {railCategories.map((entry) => {
                const count = entry === ALL ? matching.length : counts[entry] ?? 0;
                return (
                  <button
                    key={entry}
                    type="button"
                    className={styles.railItem}
                    data-active={entry === category || undefined}
                    aria-current={entry === category ? 'true' : undefined}
                    aria-label={`${entry === ALL ? 'All' : CATEGORY_LABELS[entry]}, ${count}`}
                    onClick={() => setCategory(entry)}
                  >
                    <span>{entry === ALL ? 'All' : CATEGORY_LABELS[entry]}</span>
                    <span className={styles.railCount}>{count || ''}</span>
                  </button>
                );
              })}
            </nav>

            <div className={styles.results} role="listbox" aria-label="Rules">
              {grouped.length === 0 && <p className={styles.empty}>No rule matches that.</p>}

              {grouped.map((group) => (
                <section key={group.category} className={styles.group}>
                  <h3 className={styles.groupHeading}>{CATEGORY_LABELS[group.category]}</h3>

                  {group.options.map((option) => {
                    const isActive = shown.indexOf(option) === highlighted;
                    const used = usage[option.blueprintId] ?? 0;

                    return (
                      <div
                        key={`${option.kind}:${option.blueprintId}`}
                        role="option"
                        aria-selected={isActive}
                        className={styles.row}
                        data-active={isActive || undefined}
                        onMouseMove={() => setActiveIndex(shown.indexOf(option))}
                        onClick={() => onPick(option)}
                      >
                        <span className={styles.rowSentence}>
                          {option.kind === 'condition' ? `If ${option.sentence}` : option.sentence}
                        </span>
                        <span className={styles.rowMeta}>
                          {option.name}
                          {used > 0 && ` · used ${used} ${used === 1 ? 'time' : 'times'} in this story`}
                        </span>
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>
          </div>

          <footer className={styles.footer}>
            <span className={styles.hint}>↑↓ move</span>
            <span className={styles.hint}>⇥ switch category</span>
            <span className={styles.hint}>⏎ insert into {destination}</span>
            <span className={styles.count}>
              {shown.length} of {all.length} shown
            </span>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
};
