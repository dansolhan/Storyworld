import React, { useState } from 'react';
import { NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { useEditorStore } from '../../store/useEditorStore';
import { DerivedTextEditor } from './DerivedTextEditor';
import styles from './DerivedText.module.css';

/** Enough alternatives to recognise the token; the editor shows them all. */
const CHIP_LIMIT = 3;

/**
 * A derived text in the prose, as the author sees it.
 *
 * Shows the alternatives rather than an id — the point of the design's chip is that
 * you can read what the sentence might say without opening anything. Clicking opens
 * the outcome editor.
 */
export const DerivedTextChip: React.FC<ReactNodeViewProps> = ({ node }) => {
  const derivedId = node.attrs.derivedId as string | null;
  const derived = useEditorStore((state) =>
    derivedId ? state.derivedTexts[derivedId] : undefined
  );
  const [isEditing, setIsEditing] = useState(false);

  const outcomes = derived?.outcomes ?? [];
  const shown = outcomes.slice(0, CHIP_LIMIT);
  const overflow = outcomes.length - shown.length;

  const label = derived?.name
    ? derived.name
    : shown.length === 0
      ? 'nothing yet'
      : shown.map((outcome) => outcome.text || '…').join(' / ') + (overflow > 0 ? ` / +${overflow}` : '');

  return (
    <NodeViewWrapper as="span" className={styles.chipWrapper}>
      <span
        className={styles.chip}
        data-missing={derived ? undefined : 'true'}
        role="button"
        tabIndex={0}
        title={derived ? 'Derived text — click to edit' : 'This derived text has been deleted'}
        onClick={() => setIsEditing(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsEditing(true);
          }
        }}
      >
        <span className={styles.brace}>{'{'}</span>
        {derived ? label : 'missing'}
        <span className={styles.brace}>{'}'}</span>
      </span>

      {isEditing && derived && (
        <DerivedTextEditor derived={derived} onClose={() => setIsEditing(false)} />
      )}
    </NodeViewWrapper>
  );
};
