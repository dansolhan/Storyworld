import React, { useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Target } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { SidePanel } from '../../../../components/ui/SidePanel/SidePanel';
import { Button } from '../../../../components/ui/Button/Button';
import { RichTextEditor } from '../../../../components/ui/RichTextEditor/RichTextEditor';
import { BoldFeature } from '../../../../components/ui/RichTextEditor/features/BoldFeature';
import { ItalicFeature } from '../../../../components/ui/RichTextEditor/features/ItalicFeature';
import { ContextualTextFeature } from '../../../../components/ui/RichTextEditor/features/ContextualTextFeature';
import { InsertVariableFeature } from '../../../../components/ui/RichTextEditor/features/InsertVariableFeature';
import { ConditionalsEditor } from '../ConditionalsEditor/ConditionalsEditor';
import { ActionsEditor } from '../ActionsEditor/ActionsEditor';
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
    updatePageType,
    addParagraph,
    updateParagraph,
    addChoice,
    updateChoiceText,
    connectingChoice,
    setConnectingChoice,
    createPageFromChoice
  } = useEditorStore();

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedPageId),
    [nodes, selectedPageId]
  );

  const { fitView, setNodes } = useReactFlow();

  const handleGoToTarget = (targetId: string) => {
    setSelectedPage(targetId);
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === targetId,
      }))
    );
    setTimeout(() => {
      fitView({ nodes: [{ id: targetId }], duration: 800, maxZoom: 1 });
    }, 50);
  };

  if (!selectedPageId || !selectedNode) {
    return <SidePanel position="bottom" height="50vh" isOpen={false} onClose={() => setSelectedPage(null)}><div /></SidePanel>;
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePageTitle(selectedPageId, e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePageType(selectedPageId, e.target.value as 'location' | 'plot');
  };

  return (
    <SidePanel
      isOpen={!connectingChoice}
      onClose={() => {
        if (!connectingChoice) setSelectedPage(null);
      }}
      title="Edit Page"
      position="bottom"
      height="50vh"
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
            style={{ marginBottom: '0.5rem' }}
          />

          <label className={styles.label}>Page Type</label>
          <select
            className={styles.input}
            value={selectedNode.data.type || 'location'}
            onChange={handleTypeChange}
          >
            <option value="location">Location</option>
            <option value="plot">Plot / Action</option>
          </select>

          <div style={{ marginTop: '0.5rem' }}>
            <ActionsEditor
              targetType="page"
              pageId={selectedPageId}
              targetId={selectedPageId}
              actions={selectedNode.data.actions || []}
            />
          </div>
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
            {selectedNode.data.choices.map((c, index) => {
              const isConnecting = connectingChoice?.choiceId === c.id;

              return (
                <div key={c.id} className={styles.choiceCard}>
                  <input
                    type="text"
                    className={styles.input}
                    value={c.text}
                    onChange={(e) => updateChoiceText(selectedPageId, c.id, e.target.value)}
                    placeholder={`Choice ${index + 1}...`}
                  />

                  <div className={styles.choiceConnectionControls} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                    <small className={styles.choiceMeta} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Target: {c.targetPageId ? `Page ${c.targetPageId}` : 'Unconnected'}
                      {c.targetPageId && (
                        <button
                          type="button"
                          onClick={() => handleGoToTarget(c.targetPageId!)}
                          title="Locate in graph"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--color-primary-500)'
                          }}
                        >
                          <Target size={14} />
                        </button>
                      )}
                    </small>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        size="sm"
                        variant={isConnecting ? "primary" : "secondary"}
                        onClick={() => {
                          if (isConnecting) {
                            setConnectingChoice(null);
                          } else {
                            setConnectingChoice({ sourcePageId: selectedPageId, choiceId: c.id });
                          }
                        }}
                      >
                        {isConnecting ? "Cancel" : "Connect"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => createPageFromChoice(selectedPageId, c.id)}
                      >
                        New Page
                      </Button>
                    </div>
                  </div>

                  <ConditionalsEditor
                    targetType="choice"
                    pageId={selectedPageId}
                    targetId={c.id}
                    conditionals={c.conditionals || []}
                  />
                  <ActionsEditor
                    targetType="choice"
                    pageId={selectedPageId}
                    targetId={c.id}
                    actions={c.actions || []}
                  />
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </SidePanel>
  );
};
