import React, { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Target, Lock, Unlock, AlertCircle } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { ExpandableBottomPanel } from '../../../../components/ui/ExpandableBottomPanel/ExpandableBottomPanel';
import { Button } from '../../../../components/ui/Button/Button';
import { RichTextEditor } from '../../../../components/ui/RichTextEditor/RichTextEditor';
import { BoldFeature } from '../../../../components/ui/RichTextEditor/features/BoldFeature';
import { ItalicFeature } from '../../../../components/ui/RichTextEditor/features/ItalicFeature';
import { ContextualTextFeature } from '../../../../components/ui/RichTextEditor/features/ContextualTextFeature';
import { InsertVariableFeature } from '../../../../components/ui/RichTextEditor/features/InsertVariableFeature';
import { EventsEditor } from '../EventsEditor/EventsEditor';
import { Tabs } from '../../../../components/ui/Tabs/Tabs';
import styles from './EditorSidebar.module.css';

const PARAGRAPH_FEATURES = [
  new BoldFeature(),
  new ItalicFeature(),
  new ContextualTextFeature(),
  new InsertVariableFeature(),
];

import { useSelectedPageId } from '../../hooks/page/useSelectedPageId';
import { usePageActions } from '../../hooks/page/usePageActions';
import { useParagraphActions } from '../../hooks/page/useParagraphActions';
import { useChoiceActions } from '../../hooks/page/useChoiceActions';
import { useConnectingChoice } from '../../hooks/page/useConnectingChoice';
import { useAtmospheres } from '../../hooks/page/useAtmospheres';
import { useSidebarState } from '../../hooks/view/useSidebarState';

export const EditorSidebar: React.FC = React.memo(() => {
  const selectedPageId = useSelectedPageId();
  const { setSelectedPage, updatePageTitle, updatePageType } = usePageActions();
  const { isEditorSidebarExpanded, setIsEditorSidebarExpanded, sidebarTab, setSidebarTab } = useSidebarState();
  const { addParagraph, updateParagraph } = useParagraphActions();
  const { addChoice, updateChoiceText, setConnectingChoice, createPageFromChoice } = useChoiceActions();
  const connectingChoice = useConnectingChoice();
  const atmospheres = useAtmospheres();

  const [previewStory, setPreviewStory] = useState(false);
  const [lockedParagraphIds, setLockedParagraphIds] = useState<Set<string>>(new Set());
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const paragraphListRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paragraphListRef.current && !paragraphListRef.current.contains(event.target as Node)) {
        setActiveParagraphId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLock = (paragraphId: string) => {
    setLockedParagraphIds((prev) => {
      const next = new Set(prev);
      if (next.has(paragraphId)) next.delete(paragraphId);
      else next.add(paragraphId);
      return next;
    });
  };

  const handleParagraphClick = (id: string, element: HTMLDivElement) => {
    if (activeParagraphId !== id) {
      setActiveParagraphId(id);
      
      // Slight delay ensures the layout has started expanding
      // before attempting to scroll it into view.
      setTimeout(() => {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 150);
    }
  };

  // Selector for the selected page's domain data
  const selectedPage = useEditorStore(
    (state) => state.pages[selectedPageId || '']
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

  if (!selectedPageId || !selectedPage) {
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
      pages: {
        ...state.pages,
        [selectedPageId]: {
          ...state.pages[selectedPageId],
          atmosphereId: e.target.value || undefined,
        },
      },
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
              { id: 'events', label: `Events (${(selectedPage.events || []).length})` },
              { id: 'choices', label: `Choices (${(selectedPage.choices || []).length})` }
            ]}
            activeTab={sidebarTab}
            onChange={setSidebarTab}
          />
        </div>

        {sidebarTab === 'page' && (
          <div className={styles.scrollableTab}>
            <section className={styles.section}>
              <label className={styles.label}>Page Title</label>
              <input
                type="text"
                className={styles.input}
                value={selectedPage.title}
                onChange={handleTitleChange}
                placeholder="e.g. The Dark Forest"
                style={{ marginBottom: '0.5rem' }}
              />

              <label className={styles.label}>Page Type</label>
              <select
                className={styles.input}
                value={selectedPage.type || 'location'}
                onChange={handleTypeChange}
                style={{ marginBottom: '0.5rem' }}
              >
                <option value="location">Location</option>
                <option value="plot">Plot / Action</option>
              </select>

              <label className={styles.label}>Atmosphere</label>
              <select
                className={styles.input}
                value={selectedPage.atmosphereId || ''}
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
              <div className={styles.itemList} ref={paragraphListRef}>
                {selectedPage.paragraphs.length === 0 && (
                  <p className={styles.emptyText}>No content yet. Add a paragraph!</p>
                )}
                {selectedPage.paragraphs.map((p: any) => {
                  const isLocked = lockedParagraphIds.has(p.id);
                  const isActive = activeParagraphId === p.id;

                  return (
                    <div 
                      key={p.id} 
                      onClick={(e) => handleParagraphClick(p.id, e.currentTarget)}
                      className={`story-paragraph-block ${isActive ? 'story-paragraph-active' : ''} ${styles.paragraphBlock} ${isLocked ? 'locked' : ''} ${isLocked ? styles.locked : ''} ${isActive ? styles.isActive : ''}`}
                    >
                      <div className={styles.paragraphTools}>
                        <button
                          type="button"
                          className={`${styles.lockToggle} ${isLocked ? styles.active : ''}`}
                          onClick={() => toggleLock(p.id)}
                          title={isLocked ? "Unlock Paragraph" : "Lock Paragraph"}
                        >
                          {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                          <span>{isLocked ? "Locked" : "Lock"}</span>
                        </button>
                      </div>

                      {(p.events || []).some((e: any) => e.name === 'calculateVisibility') && (
                        <div className={styles.permanentIndicators}>
                          <div 
                            className={styles.visibilityIndicator} 
                            title="Visibility Logic Attached: This paragraph contains logic that determines if it should be shown to the player."
                          >
                            <AlertCircle size={16} />
                          </div>
                        </div>
                      )}

                      <RichTextEditor
                        content={p.text}
                        features={PARAGRAPH_FEATURES}
                        hideToolbarUntilHover={true}
                        onChange={(html) => updateParagraph(selectedPageId, p.id, html)}
                      />
                      
                      <div className={styles.eventsWrapper}>
                        <EventsEditor
                          targetType="paragraph"
                          pageId={selectedPageId}
                          targetId={p.id}
                          events={p.events || []}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {sidebarTab === 'events' && (
          <div className={styles.eventsTab}>
            <label className={styles.label} style={{ marginBottom: '0.5rem', flexShrink: 0 }}>Page Events</label>
            <EventsEditor
              targetType="page"
              pageId={selectedPageId}
              targetId={selectedPageId}
              events={selectedPage.events || []}
            />
          </div>
        )}

        {sidebarTab === 'choices' && (
          <div className={styles.scrollableTab}>
            <section className={styles.section} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <input type="checkbox" id="previewStory" checked={previewStory} onChange={(e) => setPreviewStory(e.target.checked)} />
              <label htmlFor="previewStory" className={styles.label} style={{ margin: 0, cursor: 'pointer', textTransform: 'none' }}>Preview story blocks</label>
            </section>

            {previewStory && (
              <section className={styles.section} style={{ marginBottom: '2rem' }}>
                <div className={styles.itemList}>
                  {selectedPage.paragraphs.length === 0 && (
                    <p className={styles.emptyText}>No content to preview.</p>
                  )}
                  {selectedPage.paragraphs.map((p: any) => (
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
                {selectedPage.choices.length === 0 && (
                  <p className={styles.emptyText}>End of the line. Add a choice to continue the story!</p>
                )}
                {selectedPage.choices.map((c: any, index: number) => {
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

                      <EventsEditor
                        targetType="choice"
                        pageId={selectedPageId}
                        targetId={c.id}
                        events={c.events || []}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </ExpandableBottomPanel>
  );
});
