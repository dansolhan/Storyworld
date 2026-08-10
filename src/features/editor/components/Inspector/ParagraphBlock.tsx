import React, { useMemo } from 'react';
import { Lock, Unlock, AlertCircle } from 'lucide-react';
import { RichTextEditor } from '../../../../components/ui/RichTextEditor/RichTextEditor';
import { BoldFeature } from '../../../../components/ui/RichTextEditor/features/BoldFeature';
import { ItalicFeature } from '../../../../components/ui/RichTextEditor/features/ItalicFeature';
import { ContextualTextFeature } from '../../../../components/ui/RichTextEditor/features/ContextualTextFeature';
import { InsertVariableFeature } from '../../../../components/ui/RichTextEditor/features/InsertVariableFeature';
import { EventsEditor } from '../EventsEditor/EventsEditor';
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
      () => [new BoldFeature(), new ItalicFeature(), new ContextualTextFeature(), new InsertVariableFeature()],
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
          <EventsEditor
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
