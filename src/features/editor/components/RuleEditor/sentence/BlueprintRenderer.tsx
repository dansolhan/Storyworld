import React, { useState } from 'react';
import { useEditorStore } from '../../../store/useEditorStore';
import styles from './BlueprintRenderer.module.css';
import { BlueprintToken } from './BlueprintToken';
import { BlueprintPopover } from './BlueprintPopover';

interface BlueprintRendererProps {
  template: string;
  params: Record<string, unknown>;
  onChangeParam: (key: string, value: unknown) => void;
}

export const BlueprintRenderer: React.FC<BlueprintRendererProps> = ({
  template,
  params,
  onChangeParam,
}) => {
  const { nodes, variables, subplots, items } = useEditorStore();
  const [popoverState, setPopoverState] = useState<{ isOpen: boolean; x: number; y: number; tokenTarget: string }>({
    isOpen: false,
    x: 0,
    y: 0,
    tokenTarget: '',
  });

  const [inputValue, setInputValue] = useState('');

  const handleToggleBoolean = (key: string) => {
    onChangeParam(key, !params[key]);
  };

  const handleOpenPopover = (e: React.MouseEvent, tokenKey: string, initialValue?: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverState({
      isOpen: true,
      x: rect.left,
      y: rect.bottom + 5,
      tokenTarget: tokenKey,
    });
    if (initialValue !== undefined) {
      setInputValue(initialValue);
    }
  };

  const handleClosePopover = () => {
    setPopoverState((prev) => ({ ...prev, isOpen: false }));
  };

  const renderTemplate = () => {
    if (!template) return null;
    
    // Split by tokens like {{not}}, {{pageId}} etc.
    const parts = template.split(/({{\w+}})/g);

    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const key = part.slice(2, -2);
        return (
          <BlueprintToken
            key={index}
            tokenKey={key}
            params={params}
            nodes={nodes || []}
            subplots={subplots || []}
            items={items || {}}
            onOpenPopover={handleOpenPopover}
            onToggleBoolean={handleToggleBoolean}
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const pageOptions = (nodes || []).map((n) => ({ label: (n.data.title as string) || `Page ${n.id}`, value: n.id }));
  const currentSelectedSubplotId = params['subplotId'] as string | null;
  const targetPageOptions = currentSelectedSubplotId
    ? (nodes || []).filter(n => n.data.subplotId === currentSelectedSubplotId).map(n => ({ label: (n.data.title as string) || `Page ${n.id}`, value: n.id }))
    : pageOptions;

  const variableOptions = Object.keys(variables || {}).map((k) => ({ label: k, value: k }));
  const subplotOptions = (subplots || []).map(s => ({ label: s.name, value: s.id }));
  const itemOptions = Object.entries(items || {}).map(([key, item]) => ({ label: item.name, value: key }));

  return (
    <>
      <span className={styles.container}>
        {renderTemplate()}
      </span>

      <BlueprintPopover
        isOpen={popoverState.isOpen}
        x={popoverState.x}
        y={popoverState.y}
        tokenTarget={popoverState.tokenTarget}
        onClose={handleClosePopover}
        params={params}
        onChangeParam={onChangeParam}
        inputValue={inputValue}
        setInputValue={setInputValue}
        pageOptions={pageOptions}
        targetPageOptions={targetPageOptions}
        subplotOptions={subplotOptions}
        variableOptions={variableOptions}
        itemOptions={itemOptions}
      />
    </>
  );
};
