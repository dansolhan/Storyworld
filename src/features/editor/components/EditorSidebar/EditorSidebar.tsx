import React, { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useReactFlow } from '@xyflow/react';
import { Target } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { ExpandableBottomPanel } from '../../../../components/ui/ExpandableBottomPanel/ExpandableBottomPanel';
import { Button } from '../../../../components/ui/Button/Button';
import { RichTextEditor } from '../../../../components/ui/RichTextEditor/RichTextEditor';
import { BoldFeature } from '../../../../components/ui/RichTextEditor/features/BoldFeature';
import { ItalicFeature } from '../../../../components/ui/RichTextEditor/features/ItalicFeature';
import { ContextualTextFeature } from '../../../../components/ui/RichTextEditor/features/ContextualTextFeature';
import { InsertVariableFeature } from '../../../../components/ui/RichTextEditor/features/InsertVariableFeature';
import { ConditionalsEditor } from '../ConditionalsEditor/ConditionalsEditor';
import { ActionsEditor } from '../ActionsEditor/ActionsEditor';
import { Tabs } from '../../../../components/ui/Tabs/Tabs';
import styles from './EditorSidebar.module.css';

const PARAGRAPH_FEATURES = [
  new BoldFeature(),
  new ItalicFeature(),
  new ContextualTextFeature(),
  new InsertVariableFeature(),
];

export const EditorSidebar: React.FC = React.memo(() => {
  const {
    selectedPageId,
    setSelectedPage,
    isEditorSidebarExpanded,
    setIsEditorSidebarExpanded,
    sidebarTab,
    setSidebarTab,
    updatePageTitle,
    updatePageType,
    addParagraph,
    updateParagraph,
    addChoice,
    updateChoiceText,
    connectingChoice,
    setConnectingChoice,
    createPageFromChoice,
    atmospheres
  } = useEditorStore(useShallow((state) => ({
    selectedPageId: state.selectedPageId,
    setSelectedPage: state.setSelectedPage,
    isEditorSidebarExpanded: state.isEditorSidebarExpanded,
    setIsEditorSidebarExpanded: state.setIsEditorSidebarExpanded,
    sidebarTab: state.sidebarTab,
    setSidebarTab: state.setSidebarTab,
    updatePageTitle: state.updatePageTitle,
    updatePageType: state.updatePageType,
    addParagraph: state.addParagraph,
    updateParagraph: state.updateParagraph,
    addChoice: state.addChoice,
    updateChoiceText: state.updateChoiceText,
    connectingChoice: state.connectingChoice,
    setConnectingChoice: state.setConnectingChoice,
    createPageFromChoice: state.createPageFromChoice,
    atmospheres: state.atmospheres
  })));

  const [previewStory, setPreviewStory] = useState(false);

  // Selector for just the selected node's essential data
  const selectedNode = useEditorStore(
    (state) => state.nodes.find((n) => n.id === selectedPageId) as any,
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
    return (
      <ExpandableBottomPanel
        isOpen={false}
        onClose={() => setSelectedPage(null)}
        isExpanded={isEditorSidebarExpanded}
        onToggleExpand={setIsEditorSidebarExpanded}
      >
        <div />
      </ExpandableBottomPanel>
    );
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePageTitle(selectedPageId, e.target.value);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePageType(selectedPageId, e.target.value as 'location' | 'plot');
  };

  const handleAtmosphereChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // We don't have updatePageAtmosphere yet, but we can reuse nodes.map
    useEditorStore.setState((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === selectedPageId && node.type === 'pageNode') {
          return { ...node, data: { ...node.data, atmosphereId: e.target.value || undefined } } as any;
        }
        return node;
      }),
    }));
  };

  return (
    <ExpandableBottomPanel
      isOpen={!connectingChoice}
      onClose={() => {
        if (!connectingChoice) setSelectedPage(null);
      }}
      title="Edit Page"
      isExpanded={isEditorSidebarExpanded}
      onToggleExpand={setIsEditorSidebarExpanded}
    >
      <div className={styles.sidebarContent}>
        <div className={styles.stickyTabs}>
          <Tabs
            tabs={[
              { id: 'page', label: 'Page' },
              { id: 'actions', label: `Actions (${(selectedNode.data.actions || []).length})` },
              { id: 'choices', label: `Choices (${(selectedNode.data.choices || []).length})` }
            ]}
            activeTab={sidebarTab}
            onChange={setSidebarTab}
          />
        </div>

        {sidebarTab === 'page' && (
          <>
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
                style={{ marginBottom: '0.5rem' }}
              >
                <option value="location">Location</option>
                <option value="plot">Plot / Action</option>
              </select>

              <label className={styles.label}>Atmosphere</label>
              <select
                className={styles.input}
                value={selectedNode.data.atmosphereId || ''}
                onChange={handleAtmosphereChange}
              >
                <option value="">None (Default)</option>
                {Object.entries(atmospheres).map(([id, atm]) => (
                  <option key={id} value={id}>{atm.title}</option>
                ))}
              </select>
            </section>

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
                {selectedNode.data.paragraphs.map((p: any) => (
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
          </>
        )}

        {sidebarTab === 'actions' && (
          <section className={styles.section}>
            <label className={styles.label}>Page Actions</label>
            <ActionsEditor
              targetType="page"
              pageId={selectedPageId}
              targetId={selectedPageId}
              actions={selectedNode.data.actions || []}
            />
          </section>
        )}

        {sidebarTab === 'choices' && (
          <>
            <section className={styles.section} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <input type="checkbox" id="previewStory" checked={previewStory} onChange={(e) => setPreviewStory(e.target.checked)} />
              <label htmlFor="previewStory" className={styles.label} style={{ margin: 0, cursor: 'pointer', textTransform: 'none' }}>Preview story blocks</label>
            </section>

            {previewStory && (
              <section className={styles.section} style={{ marginBottom: '2rem' }}>
                <div className={styles.itemList}>
                  {selectedNode.data.paragraphs.length === 0 && (
                    <p className={styles.emptyText}>No content to preview.</p>
                  )}
                  {selectedNode.data.paragraphs.map((p: any) => (
                    <div key={p.id} className={styles.paragraphBlock} style={{ padding: '0.75rem', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-primary)' }}>
                      <div dangerouslySetInnerHTML={{ __html: p.text }} style={{ fontFamily: 'var(--font-family-serif)', lineHeight: 1.6 }} />
                      {p.conditionals && p.conditionals.length > 0 && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-border-default)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <small style={{ color: 'var(--color-primary-500)', fontWeight: 600 }}>Enabled when:</small>
                          {p.conditionals.map((c: any) => (
                            <small key={c.id} style={{ color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                              [{c.blueprintId}] {JSON.stringify(c.params)}
                            </small>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                {selectedNode.data.choices.map((c: any, index: number) => {
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
          </>
        )}
      </div>
    </ExpandableBottomPanel>
  );
});
