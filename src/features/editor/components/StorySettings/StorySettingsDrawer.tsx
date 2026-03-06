import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { ExpandableBottomPanel } from '../../../../components/ui/ExpandableBottomPanel/ExpandableBottomPanel';
import { Button } from '../../../../components/ui/Button/Button';
import styles from './StorySettingsDrawer.module.css';

interface StorySettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorySettingsDrawer: React.FC<StorySettingsDrawerProps> = ({ isOpen, onClose }) => {
  const {
    storyTitle,
    setStoryTitle,
    storyDescription,
    setStoryDescription,
    startPageId,
    isSelectingStartNode,
    setIsSelectingStartNode,
  } = useEditorStore();

  const handleSelectStartNode = () => {
    setIsSelectingStartNode(!isSelectingStartNode);
    if (!isSelectingStartNode) {
      onClose(); // Optional: Close the drawer automatically when entering selection mode
    }
  };

  return (
    <ExpandableBottomPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Story Settings"
      defaultHeight="400px"
      expandedHeight="100%"
    >
      <div className={styles.container}>
        <section className={styles.section}>
          <label className={styles.label}>Story Title</label>
          <input
            type="text"
            className={styles.input}
            value={storyTitle}
            onChange={(e) => setStoryTitle(e.target.value)}
            placeholder="E.g., The Epic Journey"
          />
        </section>

        <section className={styles.section}>
          <label className={styles.label}>Story Description</label>
          <textarea
            className={styles.textarea}
            value={storyDescription}
            onChange={(e) => setStoryDescription(e.target.value)}
            placeholder="A brief summary of your story..."
          />
        </section>

        <section className={styles.section}>
          <label className={styles.label}>Start Node</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Button
              variant={isSelectingStartNode ? 'primary' : 'secondary'}
              onClick={handleSelectStartNode}
            >
              {isSelectingStartNode ? 'Cancel Selection' : 'Select on Graph'}
            </Button>
            {startPageId && (
              <span className={styles.statusText}>Selected: Node {startPageId}</span>
            )}
            {!startPageId && (
              <span className={styles.statusText} style={{ color: 'var(--color-danger)' }}>
                No start node set
              </span>
            )}
          </div>
        </section>
      </div>
    </ExpandableBottomPanel>
  );
};
