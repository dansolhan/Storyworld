import React, { useMemo } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Drawer } from '../../../../components/ui/Drawer/Drawer';
import { Button } from '../../../../components/ui/Button/Button';
import { RichTextEditor } from '../../../../components/ui/RichTextEditor/RichTextEditor';
import { BoldFeature } from '../../../../components/ui/RichTextEditor/features/BoldFeature';
import { ItalicFeature } from '../../../../components/ui/RichTextEditor/features/ItalicFeature';
import { ContextualTextFeature } from '../../../../components/ui/RichTextEditor/features/ContextualTextFeature';
import { InsertVariableFeature } from '../../../../components/ui/RichTextEditor/features/InsertVariableFeature';
import { ConditionalsEditor } from '../ConditionalsEditor/ConditionalsEditor';
import styles from './EditorSidebar.module.css';

// Define the standard set of features for paragraphs... (handled slightly lower down, I need multiple chunks)
const PARAGRAPH_FEATURES = [
  new BoldFeature(),
  new ItalicFeature(),
  new ContextualTextFeature(),
  new InsertVariableFeature(),
];

export const EditorSidebar: React.FC = () => {
  const {
    selectedPageId,
    setSelectedPage,
    nodes,
    updatePageTitle,
    addParagraph,
    updateParagraph,
    addChoice,
    updateChoiceText
  } = useEditorStore();

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedPageId),
    [nodes, selectedPageId]
  );

  if (!selectedPageId || !selectedNode) {
    return <Drawer isOpen={false} onClose={() => setSelectedPage(null)}><div /></Drawer>;
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePageTitle(selectedPageId, e.target.value);
  };

  return (
    <Drawer
      isOpen={true}
      onClose={() => setSelectedPage(null)}
      title="Edit Page"
      width="450px"
    >
      <div className={styles.sidebarContent}>

        {/* Title Section */}
        <section className={styles.section}>
          <label className={styles.label}>Page Title</label>
          <input
            type="text"
            className={styles.input}
            value={selectedNode.data.title}
            onChange={handleTitleChange}
            placeholder="e.g. The Dark Forest"
          />
        </section>

        {/* Paragraphs Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>Content Blocks</label>
            <Button size="sm" variant="secondary" onClick={() => addParagraph(selectedPageId)}>
              + Add
            </Button>
          </div>
          <div className={styles.itemList}>
            {selectedNode.data.paragraphs.length === 0 && (
              <p className={styles.emptyText}>No content yet. Add a paragraph!</p>
            )}
            {selectedNode.data.paragraphs.map((p) => (
              <div key={p.id} className={styles.paragraphBlock}>
                <RichTextEditor
                  content={p.text}
                  features={PARAGRAPH_FEATURES}
                  onChange={(html) => updateParagraph(selectedPageId, p.id, html)}
                />
                <ConditionalsEditor
                  targetType="paragraph"
                  pageId={selectedPageId}
                  targetId={p.id}
                  conditionals={p.conditionals || []}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Choices Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <label className={styles.label}>Choices (Outbound Edges)</label>
            <Button size="sm" variant="secondary" onClick={() => addChoice(selectedPageId)}>
              + Add
            </Button>
          </div>
          <div className={styles.itemList}>
            {selectedNode.data.choices.length === 0 && (
              <p className={styles.emptyText}>End of the line. Add a choice to continue the story!</p>
            )}
            {selectedNode.data.choices.map((c, index) => (
              <div key={c.id} className={styles.choiceCard}>
                <input
                  type="text"
                  className={styles.input}
                  value={c.text}
                  onChange={(e) => updateChoiceText(selectedPageId, c.id, e.target.value)}
                  placeholder={`Choice ${index + 1}...`}
                />
                <small className={styles.choiceMeta}>
                  Target: {c.targetPageId ? `Page ${c.targetPageId}` : 'Unconnected'}
                </small>
                <ConditionalsEditor
                  targetType="choice"
                  pageId={selectedPageId}
                  targetId={c.id}
                  conditionals={c.conditionals || []}
                />
              </div>
            ))}
          </div>
        </section>

      </div>
    </Drawer>
  );
};
