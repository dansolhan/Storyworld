import React, { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import { useUsageIndex, usageFor } from '../../hooks/data/useUsageIndex';
import { useFilteredEntries } from '../../hooks/data/useFilteredEntries';
import { DataWorkspace } from './DataWorkspace';
import { DataRow } from './DataRow';
import { ItemDetail } from './ItemDetail';
import { DeleteEntityDialog } from './DeleteEntityDialog';
import { usageLabel } from './usageLabel';
import type { Item } from '../../../../domain/Item/Item';
import rowStyles from './DataRow.module.css';

/** From the design: 1.6fr 1.1fr 1.2fr .8fr. */
const COLUMNS = 'minmax(0, 1.6fr) minmax(0, 1.1fr) minmax(0, 1.2fr) minmax(0, 0.8fr)';

const newItemId = (): string => `item_${crypto.randomUUID().slice(0, 8)}`;

export const ItemsWorkspace: React.FC = () => {
  const { items, addItem, removeItem } = useEditorStore(
    useShallow((state) => ({
      items: state.items,
      addItem: state.addItem,
      removeItem: state.removeItem,
    }))
  );

  const usage = useUsageIndex();
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  const entries = useMemo(
    () =>
      Object.values(items ?? {}).map((item) => ({
        item,
        haystack: [item.name, item.id, ...item.tags].join(' ').toLowerCase(),
      })),
    [items]
  );
  const visible = useFilteredEntries(entries, filter);

  const selected = selectedId ? items?.[selectedId] : undefined;

  const handleNew = () => {
    const id = newItemId();
    addItem(id, {
      id,
      name: 'New item',
      nameLocId: crypto.randomUUID(),
      description: '',
      descriptionLocId: crypto.randomUUID(),
      tags: [],
      multiple: false,
      contextChoices: [],
    });
    setSelectedId(id);
  };

  return (
    <>
      <DataWorkspace
        title="Items"
        explanation="Things the reader can be given, carry and spend."
        filter={filter}
        onFilterChange={setFilter}
        filterPlaceholder="Filter by name, id or tag…"
        newLabel="New item"
        onNew={handleNew}
        columns={['Name', 'ID', 'Tags', 'Used on']}
        columnTemplate={COLUMNS}
        isEmpty={visible.length === 0}
        emptyMessage={
          entries.length === 0
            ? 'No items yet. Anything the reader can carry starts here.'
            : 'Nothing matches that filter.'
        }
        detail={
          selected && (
            <ItemDetail
              item={selected}
              usage={usageFor(usage, 'item', selected.id)}
              onDelete={() => setPendingDelete(selected)}
            />
          )
        }
      >
        {visible.map(({ item }) => {
          const itemUsage = usageFor(usage, 'item', item.id);
          return (
            <DataRow
              key={item.id}
              label={item.name}
              isSelected={item.id === selectedId}
              onSelect={() => setSelectedId(item.id)}
              columnTemplate={COLUMNS}
            >
              <span className={rowStyles.name}>{item.name}</span>
              <span className={rowStyles.mono}>{item.id}</span>
              <span className={rowStyles.tags}>{item.tags.join(' · ')}</span>
              <span
                className={itemUsage.references.length === 0 ? rowStyles.unused : rowStyles.usage}
              >
                {usageLabel(itemUsage)}
              </span>
            </DataRow>
          );
        })}
      </DataWorkspace>

      {pendingDelete && (
        <DeleteEntityDialog
          isOpen
          name={pendingDelete.name}
          kind="item"
          usage={usageFor(usage, 'item', pendingDelete.id)}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeItem(pendingDelete.id);
            if (selectedId === pendingDelete.id) setSelectedId(null);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );
};
