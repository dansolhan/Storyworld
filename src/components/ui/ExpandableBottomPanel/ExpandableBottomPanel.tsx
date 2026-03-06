import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { SidePanel } from '../SidePanel/SidePanel';

export interface ExpandableBottomPanelProps {
  /** Determines if the panel is open at all */
  isOpen: boolean;
  /** Callback triggered when close mechanism is activated */
  onClose?: () => void;
  /** Panel title */
  title?: React.ReactNode;
  /** Any extra actions to display in the header before the expand/collapse button */
  headerActions?: React.ReactNode;
  /** The content of the panel */
  children: React.ReactNode;
  /** Optional controlled expanded state */
  isExpanded?: boolean;
  /** Optional controlled expanded state toggle callback */
  onToggleExpand?: (expanded: boolean) => void;
  /** Height of the panel when not expanded. Default: "50vh" */
  defaultHeight?: string;
  /** Height of the panel when expanded. Default: "100%" */
  expandedHeight?: string;
}

export const ExpandableBottomPanel: React.FC<ExpandableBottomPanelProps> = ({
  isOpen,
  onClose,
  title,
  headerActions,
  children,
  isExpanded: controlledIsExpanded,
  onToggleExpand,
  defaultHeight = '50vh',
  expandedHeight = '100%',
}) => {
  const isControlled = controlledIsExpanded !== undefined;
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isExpanded = isControlled ? controlledIsExpanded : internalExpanded;

  const handleToggle = () => {
    const newState = !isExpanded;
    if (isControlled && onToggleExpand) {
      onToggleExpand(newState);
    } else {
      setInternalExpanded(newState);
    }
  };

  const headerChevron = (
    <button
      onClick={handleToggle}
      style={{
        background: 'none',
        border: 'none',
        padding: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-secondary)',
        borderRadius: 'var(--radius-sm)'
      }}
      title={isExpanded ? "Collapse" : "Expand fully"}
    >
      {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
    </button>
  );

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      headerActions={
        <>
          {headerActions}
          {headerChevron}
        </>
      }
      position="bottom"
      height={isExpanded ? expandedHeight : defaultHeight}
    >
      {children}
    </SidePanel>
  );
};
