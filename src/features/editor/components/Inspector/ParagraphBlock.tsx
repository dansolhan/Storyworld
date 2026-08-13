import React, { useMemo } from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import { RichTextEditor } from '../../../../components/ui/RichTextEditor/RichTextEditor';
import { BoldFeature } from '../../../../components/ui/RichTextEditor/features/BoldFeature';
import { ItalicFeature } from '../../../../components/ui/RichTextEditor/features/ItalicFeature';
import { ContextualTextFeature } from '../../../../components/ui/RichTextEditor/features/ContextualTextFeature';
import { InsertVariableFeature } from '../../../../components/ui/RichTextEditor/features/InsertVariableFeature';
import { RuleEditor } from '../RuleEditor/RuleEditor';
import { ContextualMarkPicker } from '../ContextualText/ContextualMarkPicker';
import { DerivedTextChip } from '../DerivedText/DerivedTextChip';
import { DerivedTextFeature } from '../../../../components/ui/RichTextEditor/features/DerivedTextFeature';
import { useEditorStore } from '../../store/useEditorStore';
import type { Paragraph } from '../../../../domain/Paragraph/Paragraph';
import styles from './ParagraphBlock.module.css';

export interface ParagraphBlockProps {
  paragraph: Paragraph;
  pageId: string;
  isLocked: boolean;
  isActive: boolean;
  onActivate: (paragraphId: string, element: HTMLDivElement) => void;
  onToggleLock: (paragraphId: string) => void;
  onChange: (pageId: string, paragraphId: string, html: string) => void;
}

const VISIBILITY_EVENT = 'calculateVisibility';

export const ParagraphBlock = React.memo(
  ({ paragraph, pageId, isLocked, isActive, onActivate, onToggleLock, onChange }: ParagraphBlockProps) => {
    // Built per block so two editors never share feature instances.
    const features = useMemo(
      () => [
        new BoldFeature(),
        new ItalicFeature(),
        /*
         * The picker is injected rather than imported by the feature: choosing an
         * entry needs the story's entries, and the rich-text editor is generic UI.
         */
        new ContextualTextFeature({
          renderPicker: (props) => <ContextualMarkPicker {...props} />,
        }),
        new InsertVariableFeature(),
        new DerivedTextFeature({
          renderChip: DerivedTextChip,
          /*
           * Reads the store at call time rather than closing over it, so the feature
           * — built once per block — never holds a stale action.
           */
          createDerivedText: () => {
            const id = `dt-${crypto.randomUUID().slice(0, 8)}`;
            useEditorStore.getState().addDerivedText({ id, outcomes: [] });
            return id;
          },
        }),
      ],
      []
    );

    const hasVisibilityLogic = (paragraph.events ?? []).some((event) => event.name === VISIBILITY_EVENT);

    return (
      <div
        id={`paragraph-${paragraph.id}`}
        className={`story-paragraph-block ${isActive ? 'story-paragraph-active' : ''} ${styles.block} ${isLocked ? 'locked' : ''}`}
        data-locked={isLocked || undefined}
        data-active={isActive || undefined}
        onClick={(event) => onActivate(paragraph.id, event.currentTarget)}
        onFocusCapture={(event) => onActivate(paragraph.id, event.currentTarget)}
      >
        <div className={styles.tools}>
          <button
            type="button"
            className={styles.lockToggle}
            data-active={isLocked || undefined}
            onClick={() => onToggleLock(paragraph.id)}
            title={isLocked ? 'Unlock paragraph' : 'Lock paragraph'}
          >
            {isLocked ? <Lock className={styles.toolIcon} /> : <Unlock className={styles.toolIcon} />}
            <span>{isLocked ? 'Locked' : 'Lock'}</span>
          </button>

          {hasVisibilityLogic && (
            <span
              className={styles.visibilityIndicator}
              title="Visibility logic attached: this paragraph decides for itself whether the reader sees it."
            >
              <AlertCircle className={styles.toolIcon} />
              Conditional
            </span>
          )}
        </div>

        <RichTextEditor
          content={paragraph.text}
          features={features}
          hideToolbarUntilHover={true}
          onChange={(html) => onChange(pageId, paragraph.id, html)}
        />

        <div className={styles.events}>
          <RuleEditor
            targetType="paragraph"
            pageId={pageId}
            targetId={paragraph.id}
            events={paragraph.events || []}
          />
        </div>
      </div>
    );
  }
);
