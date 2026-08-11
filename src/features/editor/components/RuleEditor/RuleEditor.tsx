import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { eventLabel, eventsForDomain } from '../../../../domain/Events/StoryEvent';
import { RuleRow } from './RuleRow';
import { RulePicker } from './RulePicker';
import { insertNode, moveNode, removeNode, updateNodeParams } from './ruleTree';
import { newRuleNode } from './newRuleNode';
import type { StoryEvent } from '../../../../domain/Events/StoryEvent';
import type { RuleOption } from './rulePickerOptions';
import styles from './RuleEditor.module.css';

export type RuleTarget = 'page' | 'paragraph' | 'choice';

export interface RuleEditorProps {
  targetType: RuleTarget;
  pageId: string;
  targetId: string;
  events: StoryEvent[];
}

interface PendingInsert {
  eventId: string;
  parentId: string | null;
  destination: 'Then' | 'Else' | 'this rule';
}

/**
 * Rules as prose, grouped by the moment they run.
 *
 * Replaces the drag-and-drop tree builder. The data is untouched — the same
 * `events[]` carrying the same `logicTree` the evaluator reads — so this is
 * entirely a change of presentation.
 */
export const RuleEditor: React.FC<RuleEditorProps> = ({ targetType, pageId, targetId, events }) => {
  const { addEvent, removeEvent, updateEventLogicTree } = useEditorStore(
    useShallow((state) => ({
      addEvent: state.addEvent,
      removeEvent: state.removeEvent,
      updateEventLogicTree: state.updateEventLogicTree,
    }))
  );

  const [pending, setPending] = useState<PendingInsert | null>(null);

  const moments = eventsForDomain(targetType);
  // Compared by label, not name: a story still carrying the pre-2 `onEvaluate` would
  // otherwise be offered its replacement and end up with two identical section titles.
  const used = new Set(events.map((event) => eventLabel(event.name)));
  const unused = moments.filter((moment) => !used.has(moment.label));

  const setTree = (event: StoryEvent, tree: Parameters<typeof updateEventLogicTree>[4]) =>
    updateEventLogicTree(targetType, pageId, targetId, event.id, tree);

  const actionsFor = (event: StoryEvent) => ({
    onChangeParam: (nodeId: string, key: string, value: unknown) =>
      setTree(event, updateNodeParams(event.logicTree, nodeId, { [key]: value })),
    onRemove: (nodeId: string) => setTree(event, removeNode(event.logicTree, nodeId)),
    onMove: (nodeId: string, delta: -1 | 1) =>
      setTree(event, moveNode(event.logicTree, nodeId, delta)),
    onAdd: (parentId: string | null, into: 'then' | 'else' | 'rule') =>
      setPending({
        eventId: event.id,
        parentId,
        destination: into === 'then' ? 'Then' : into === 'else' ? 'Else' : 'this rule',
      }),
  });

  const insertPicked = (option: RuleOption) => {
    if (!pending) return;
    const event = events.find((candidate) => candidate.id === pending.eventId);
    if (!event) return;

    setTree(
      event,
      insertNode(event.logicTree, pending.parentId, newRuleNode(option.kind, option.blueprintId))
    );
    setPending(null);
  };

  return (
    <div className={styles.editor}>
      {events.length === 0 && (
        <p className={styles.noRules}>Nothing happens here yet.</p>
      )}

      {events.map((event) => {
        const actions = actionsFor(event);

        return (
          <section key={event.id} className={styles.section}>
            <header className={styles.sectionHeader}>
              <h4 className={styles.sectionTitle}>{eventLabel(event.name)}</h4>
              <button
                type="button"
                className={styles.removeSection}
                onClick={() => removeEvent(targetType, pageId, targetId, event.id)}
              >
                Remove
              </button>
            </header>

            {event.logicTree.length === 0 ? (
              <p className={styles.doNothing}>no rules yet</p>
            ) : (
              event.logicTree.map((node, index) => (
                <RuleRow
                  key={node.id}
                  node={node}
                  canMoveUp={index > 0}
                  canMoveDown={index < event.logicTree.length - 1}
                  {...actions}
                />
              ))
            )}

            <button type="button" className={styles.addRule} onClick={() => actions.onAdd(null, 'rule')}>
              <Plus className={styles.addIcon} aria-hidden="true" />
              Add rule
            </button>
          </section>
        );
      })}

      {unused.length > 0 && (
        <div className={styles.addMoment}>
          <span className={styles.addMomentLabel}>Add a moment</span>
          {unused.map((moment) => (
            <button
              key={moment.name}
              type="button"
              className={styles.momentButton}
              onClick={() => addEvent(targetType, pageId, targetId, moment.name)}
            >
              {moment.label}
            </button>
          ))}
        </div>
      )}

      {pending && (
        <RulePicker
          destination={pending.destination}
          onCancel={() => setPending(null)}
          onPick={insertPicked}
        />
      )}
    </div>
  );
};
