import React, { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Search, ExternalLink } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { ExpandableBottomPanel } from '../../../../components/ui/ExpandableBottomPanel/ExpandableBottomPanel';
import styles from './ContextManager.module.css';

interface ContextItem {
  id: string;
  pageId: string;
  pageTitle: string;
  anchorText: string;
  title: string;
  text: string;
}

interface ContextManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContextManager: React.FC<ContextManagerProps> = React.memo(({ isOpen, onClose }) => {
  const { pages, setSelectedPage } = useEditorStore(
    useShallow((state) => ({
      pages: state.pages,
      setSelectedPage: state.setSelectedPage,
    }))
  );

  const [filterText, setFilterText] = useState('');

  const allContextItems = useMemo(() => {
    const items: ContextItem[] = [];
    const parser = new DOMParser();

    Object.entries(pages).forEach(([pageId, page]) => {
      page.paragraphs.forEach((p) => {
        const doc = parser.parseFromString(p.text, 'text/html');
        const marks = doc.querySelectorAll('.contextual-text-mark');
        marks.forEach((mark, index) => {
          items.push({
            id: `${p.id}-${index}`,
            pageId,
            pageTitle: page.title,
            anchorText: mark.textContent || '',
            title: mark.getAttribute('data-title') || '',
            text: mark.getAttribute('data-context') || '',
          });
        });
      });
    });

    return items;
  }, [pages]);

  const filteredItems = useMemo(() => {
    const query = filterText.toLowerCase();
    if (!query) return allContextItems;

    return allContextItems.filter(item => 
      item.title.toLowerCase().includes(query) ||
      item.text.toLowerCase().includes(query) ||
      item.anchorText.toLowerCase().includes(query) ||
      item.pageTitle.toLowerCase().includes(query)
    );
  }, [allContextItems, filterText]);

  const handleGoToPage = (pageId: string) => {
    setSelectedPage(pageId);
    onClose();
  };

  return (
    <ExpandableBottomPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Contextual Text Explorer"
      defaultHeight="500px"
      expandedHeight="100%"
    >
      <div className={styles.container}>
        <div className={styles.searchBar}>
          <Search size={18} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by title, text, anchor or page..."
            className={styles.input}
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>

        <div className={styles.list}>
          {filteredItems.map((item) => (
            <div key={item.id} className={styles.contextRow}>
              <div className={styles.rowHeader}>
                <span className={styles.titleText}>{item.title || '(No Title)'}</span>
                <div className={styles.pageLink} onClick={() => handleGoToPage(item.pageId)}>
                  {item.pageTitle} <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </div>
              </div>
              <div className={styles.anchorText}>Linked to: "{item.anchorText}"</div>
              <div 
                className={styles.contentText}
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
            </div>
          ))}
          {filteredItems.length === 0 && (
            <p className={styles.empty}>No contextual text found matching your search.</p>
          )}
        </div>
      </div>
    </ExpandableBottomPanel>
  );
});
