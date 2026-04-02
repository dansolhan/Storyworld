import React, { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Pencil, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store/useEditorStore';
import { ExpandableBottomPanel } from '../../../../components/ui/ExpandableBottomPanel/ExpandableBottomPanel';
import { Button } from '../../../../components/ui/Button/Button';
import { TagInput } from '../../../../components/ui/TagInput/TagInput';
import { RichTextEditor } from '../../../../components/ui/RichTextEditor/RichTextEditor';
import { BoldFeature } from '../../../../components/ui/RichTextEditor/features/BoldFeature';
import { ItalicFeature } from '../../../../components/ui/RichTextEditor/features/ItalicFeature';
import { ContextualTextFeature } from '../../../../components/ui/RichTextEditor/features/ContextualTextFeature';
import { InsertVariableFeature } from '../../../../components/ui/RichTextEditor/features/InsertVariableFeature';
import type { Item } from '../../../../domain/Item/Item';
import styles from './ItemManager.module.css';

const ITEM_DESC_FEATURES = [
  new BoldFeature(),
  new ItalicFeature(),
  new ContextualTextFeature(),
  new InsertVariableFeature(),
];

interface ItemRowProps {
  itemKey: string;
  item: Item;
  updateItem: (key: string, value: Item) => void;
  removeItem: (key: string) => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ itemKey, item, updateItem, removeItem }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleEditTags = (tags: string[]) => {
    updateItem(itemKey, { ...item, tags });
  };

  if (!isEditing) {
    return (
      <div className={styles.itemRow}>
        <div className={styles.itemHeader}>
          <div className={styles.keyDisplay}>
            {item.name} <span style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>({itemKey})</span>
            {item.multiple && <span style={{ marginLeft: '8px', fontSize: '0.8em', color: 'var(--color-primary-600)' }}>[Multiple]</span>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              {item.tags?.map((tag, idx) => (
                <span key={idx} className={styles.chip}>{tag}</span>
              ))}
            </div>
          </div>
          <div
            style={{ flex: 1, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}
            dangerouslySetInnerHTML={{ __html: item.description || '' }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit">
              <Pencil size={16} />
            </Button>
            <Button
              variant={confirmDelete ? "danger" : "ghost-danger"}
              size={confirmDelete ? "sm" : "icon"}
              onClick={() => {
                if (confirmDelete) {
                  removeItem(itemKey);
                } else {
                  setConfirmDelete(true);
                }
              }}
              onMouseLeave={() => setConfirmDelete(false)}
              aria-label="Delete"
            >
              <Trash2 size={16} color={confirmDelete ? 'white' : 'currentColor'} />
              {confirmDelete && <span style={{ marginLeft: '4px', whiteSpace: 'nowrap' }}>Click to confirm</span>}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.itemRow}>
      <div className={styles.itemHeader} style={{ alignSelf: 'flex-start', paddingTop: '8px' }}>
        <div className={styles.keyDisplay}>
          Editing {item.name} <span style={{ fontSize: '0.8em', color: 'var(--color-text-secondary)' }}>({itemKey})</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <div className={styles.inputRow}>
          <input
            type="text"
            className={styles.input}
            value={item.name}
            onChange={(e) => updateItem(itemKey, { ...item, name: e.target.value })}
            placeholder="Item Name"
          />
          <input
            type="text"
            className={styles.input}
            value={item.imageUrl || ''}
            onChange={(e) => updateItem(itemKey, { ...item, imageUrl: e.target.value })}
            placeholder="Image URL (Optional)"
            style={{ flex: 0.5 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={item.multiple}
              onChange={(e) => updateItem(itemKey, { ...item, multiple: e.target.checked })}
            />
            Multiple?
          </label>
        </div>
        <div style={{ flex: 1, minHeight: '100px', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)' }}>
          <RichTextEditor
            content={item.description}
            features={ITEM_DESC_FEATURES}
            onChange={(html) => updateItem(itemKey, { ...item, description: html })}
          />
        </div>
        <TagInput
          tags={item.tags || []}
          onChange={handleEditTags}
          placeholder="Add tags..."
        />
        {/* Placeholder for Context Choices, to be implemented later if needed */}
        <div style={{ fontSize: '0.875rem', color: 'var(--color-primary-600)', padding: '4px 0' }}>
          Context Choices editing will be available soon. Note: "Examine" is always available by default.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignSelf: 'flex-start' }}>
        <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Done</Button>
      </div>
    </div>
  );
};

interface ItemManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ItemManager: React.FC<ItemManagerProps> = React.memo(({ isOpen, onClose }) => {
  const { items, addItem, updateItem, removeItem } = useEditorStore(
    useShallow((state) => ({
      items: state.items,
      addItem: state.addItem,
      updateItem: state.updateItem,
      removeItem: state.removeItem,
    }))
  );

  const [filterText, setFilterText] = useState('');

  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImg, setNewImg] = useState('');
  const [newMultiple, setNewMultiple] = useState(false);
  const [newTags, setNewTags] = useState<string[]>([]);

  const handleAdd = () => {
    if (newKey && newName && !items[newKey]) {
      addItem(newKey, {
        id: newKey,
        name: newName,
        nameLocId: crypto.randomUUID(),
        description: newDesc,
        descriptionLocId: crypto.randomUUID(),
        imageUrl: newImg || undefined,
        tags: newTags,
        multiple: newMultiple,
        contextChoices: [],
      });
      setNewKey('');
      setNewName('');
      setNewDesc('');
      setNewImg('');
      setNewMultiple(false);
      setNewTags([]);
    }
  };

  const filteredItems = useMemo(() => {
    const query = filterText.toLowerCase();
    if (!query) return Object.entries(items);

    return Object.entries(items).filter(([key, item]) => {
      const matchKey = key.toLowerCase().includes(query);
      const matchName = item.name.toLowerCase().includes(query);
      const matchTags = item.tags?.some(tag => tag.toLowerCase().includes(query));
      return matchKey || matchName || matchTags;
    });
  }, [items, filterText]);

  return (
    <ExpandableBottomPanel
      isOpen={isOpen}
      onClose={onClose}
      title="Inventory Items"
      defaultHeight="450px"
      expandedHeight="100%"
    >
      <div className={styles.container}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <p className={styles.description} style={{ flex: 1, margin: 0 }}>
            Create items that players can collect and use.
          </p>
          <input
            type="text"
            placeholder="Search by name, ID, or tags..."
            className={styles.input}
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{ width: '200px', flex: 'none' }}
          />
        </div>

        {/* Add Item Form */}
        <div className={styles.addForm}>
          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.input}
              placeholder="Item ID (e.g. rusty_key)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              style={{ flex: 1 }}
            />
            <input
              type="text"
              className={styles.input}
              placeholder="Display Name (e.g. Rusty Key)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ flex: 1.5 }}
            />
            <input
              type="text"
              className={styles.input}
              placeholder="Image URL (Optional)"
              value={newImg}
              onChange={(e) => setNewImg(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
          <div className={styles.inputRow} style={{ marginTop: '8px', alignItems: 'center' }}>
            <div style={{ flex: 2, minHeight: '80px', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <RichTextEditor
                content={newDesc}
                features={ITEM_DESC_FEATURES}
                onChange={(html) => setNewDesc(html)}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={newMultiple}
                onChange={(e) => setNewMultiple(e.target.checked)}
              />
              Multiple?
            </label>
          </div>
          <div className={styles.inputRow} style={{ marginTop: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <TagInput
                tags={newTags}
                onChange={setNewTags}
                placeholder="Add tags..."
              />
            </div>
            <Button onClick={handleAdd} size="sm" disabled={!newKey || !newName}>Add Item</Button>
          </div>
        </div>

        <div className={styles.list}>
          {filteredItems.map(([key, item]) => (
            <ItemRow
              key={key}
              itemKey={key}
              item={item}
              updateItem={updateItem}
              removeItem={removeItem}
            />
          ))}
          {filteredItems.length === 0 && (
            <p className={styles.empty}>No items matched.</p>
          )}
        </div>
      </div>
    </ExpandableBottomPanel>
  );
});
