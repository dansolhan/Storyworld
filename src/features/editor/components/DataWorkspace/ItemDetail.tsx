import React, { useMemo } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { RichTextEditor } from '../../../../components/ui/RichTextEditor/RichTextEditor';
import { BoldFeature } from '../../../../components/ui/RichTextEditor/features/BoldFeature';
import { ItalicFeature } from '../../../../components/ui/RichTextEditor/features/ItalicFeature';
import { InsertVariableFeature } from '../../../../components/ui/RichTextEditor/features/InsertVariableFeature';
import { TagInput } from '../../../../components/ui/TagInput/TagInput';
import { WhereItAppears } from './WhereItAppears';
import type { Item } from '../../../../domain/Item/Item';
import type { UsageEntry } from '../../usage/usageReference';
import styles from './DetailPanel.module.css';

export interface ItemDetailProps {
  item: Item;
  usage: UsageEntry;
  onDelete: () => void;
}

export const ItemDetail: React.FC<ItemDetailProps> = ({ item, usage, onDelete }) => {
  const updateItem = useEditorStore((state) => state.updateItem);

  // Built per panel so two editors never share feature instances.
  const features = useMemo(
    () => [new BoldFeature(), new ItalicFeature(), new InsertVariableFeature()],
    []
  );

  const patch = (updates: Partial<Item>) => updateItem(item.id, { ...item, ...updates });

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>{item.name}</h2>
        <button type="button" className={styles.delete} onClick={onDelete}>
          Delete
        </button>
      </header>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>ID</span>
        <input
          className={`${styles.input} ${styles.mono} ${styles.readOnly}`}
          value={item.id}
          readOnly
          aria-describedby={`${item.id}-id-note`}
        />
        <p className={styles.fieldNote} id={`${item.id}-id-note`}>
          Referred to by this id wherever it is given or required.
        </p>
      </label>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>Display name</span>
        <input
          className={styles.input}
          value={item.name}
          onChange={(event) => patch({ name: event.target.value })}
        />
      </label>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Description</span>
        <div className={styles.richText}>
          <RichTextEditor
            content={item.description}
            features={features}
            onChange={(html) => patch({ description: html })}
          />
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>Tags</span>
        <TagInput tags={item.tags} onChange={(tags) => patch({ tags })} placeholder="Add a tag…" />
      </div>

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={item.multiple}
          onChange={(event) => patch({ multiple: event.target.checked })}
        />
        Stackable
      </label>

      <WhereItAppears usage={usage} />
    </div>
  );
};
