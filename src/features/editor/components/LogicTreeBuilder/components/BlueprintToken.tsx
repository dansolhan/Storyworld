import React from 'react';
import type { EditorNode } from '../../../store/editorTypes';
import type { Subplot } from '../../../../../domain/Story/Subplot';
import type { Item } from '../../../../../domain/Item/Item';
import { InteractiveToken } from './InteractiveToken';

interface BlueprintTokenProps {
  tokenKey: string;
  params: Record<string, any>;
  nodes: EditorNode[];
  subplots: Subplot[];
  items: Record<string, Item>;
  onOpenPopover: (e: React.MouseEvent, tokenKey: string, initialValue?: string) => void;
  onToggleBoolean: (key: string) => void;
}

export const BlueprintToken: React.FC<BlueprintTokenProps> = ({
  tokenKey,
  params,
  nodes,
  subplots,
  items,
  onOpenPopover,
  onToggleBoolean,
}) => {
  if (tokenKey === 'not' || tokenKey === 'is_not' || tokenKey === 'has_not') {
    let labelTrue = 'NOT';
    let labelFalse = '(optionally NOT)';

    if (tokenKey === 'is_not') {
      labelTrue = 'is not';
      labelFalse = 'is';
    } else if (tokenKey === 'has_not') {
      labelTrue = 'has not';
      labelFalse = 'has';
    }

    return (
      <InteractiveToken onClick={() => onToggleBoolean('not')}>
        {params.not ? labelTrue : labelFalse}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'page' || tokenKey === 'pageId') {
    const selectedPageId = params[tokenKey] as string | null;
    const selectedNode = nodes?.find((n: EditorNode) => n.id === selectedPageId);
    const label = selectedNode ? (selectedNode.data.title as string) || `Page ${selectedNode.id}` : 'Select a page...';

    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'pageId')}>
        {label}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'targetPageId') {
    const selectedPageId = params['targetPageId'] as string | null;
    const selectedNode = nodes?.find((n: EditorNode) => n.id === selectedPageId);
    const label = selectedNode ? (selectedNode.data.title as string) || `Page ${selectedNode.id}` : 'Select a page...';

    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'targetPageId')}>
        {label}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'subplotId') {
    const selectedSubplotId = params['subplotId'] as string | null;
    const selectedSubplot = subplots?.find(s => s.id === selectedSubplotId);
    const label = selectedSubplot ? selectedSubplot.name : 'Select a subplot...';

    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'subplotId')}>
        {label}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'variable') {
    const varKey = params.variableKey as string | null;
    const label = varKey ? varKey : 'Select variable...';
    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'variableKey')}>
        {label}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'value') {
    const val = params.value as string;
    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'value', val || '')}>
        {val || '...'}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'message') {
    const msg = params.message as string;
    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'message', msg || '')}>
        {msg ? `"${msg}"` : '...'}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'displayStyle') {
    const style = params.displayStyle as string;
    const label = style === 'paragraph' ? 'a paragraph' : 'a styled notification';
    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'displayStyle')}>
        {label}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'itemId') {
    const selectedItemId = params.itemId as string | null;
    const selectedItem = selectedItemId && items ? items[selectedItemId] : null;
    const label = selectedItem ? selectedItem.name : 'Select item...';
    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'itemId')}>
        {label}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'count') {
    const selectedItemId = params.itemId as string | null;
    const selectedItem = selectedItemId && items ? items[selectedItemId] : null;
    if (selectedItem && !selectedItem.multiple) {
      return null;
    }
    const val = params.count as number;
    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'count', String(val || 1))}>
        {val || 1}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'comparison') {
    const val = (params.comparison as string) || 'equal';
    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'comparison')}>
        {val}
      </InteractiveToken>
    );
  }

  if (tokenKey === 'data') {
    const data = (params.data as any[]) || [];
    const label = data.length > 0 
      ? `${data.length} field${data.length > 1 ? 's' : ''}` 
      : 'Add data...';
    return (
      <InteractiveToken onClick={(e) => onOpenPopover(e, 'data')}>
        {label}
      </InteractiveToken>
    );
  }

  return <span>{`{{${tokenKey}}}`}</span>;
};
