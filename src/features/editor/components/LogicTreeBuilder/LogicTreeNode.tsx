import React from 'react';
import type { NodeRendererProps } from 'react-arborist';
import type { LogicNode } from './types';
import { Zap, HelpCircle, ChevronRight, ChevronDown, GripVertical, Trash2 } from 'lucide-react';
import { actionBlueprints } from '../../../../domain/Actions/registry';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import { LogicTreeContext } from './logicTreeContext';
import { BlueprintRenderer } from './BlueprintRenderer';
import styles from './LogicTreeNode.module.css';

export const LogicTreeNode: React.FC<NodeRendererProps<LogicNode>> = ({
  node,
  style,
  dragHandle,
  tree
}) => {
  const isAction = node.data.type === 'action';
  const isCondition = node.data.type === 'condition';
  const isBranch = node.data.type === 'branch_then' || node.data.type === 'branch_else' || node.data.type === 'branch_conditions';
  const branchName = node.data.type === 'branch_then' ? 'Then' : node.data.type === 'branch_else' ? 'Else' : 'Conditions';

  const context = React.useContext(LogicTreeContext);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    tree.delete(node.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isInternal) {
      node.toggle();
    }
  };

  return (
    <div
      style={style}
      className={`
        ${styles.nodeWrapper}
        ${node.state.isSelected ? styles.selected : ''}
        ${node.state.isDragging ? styles.dragging : ''}
      `}
      onClick={() => node.select()}
      data-id={node.id}
    >
      <div 
        className={`
          ${styles.nodeContent} 
          ${isAction ? styles.typeAction : ''} 
          ${isCondition ? styles.typeCondition : ''}
          ${isBranch ? styles.typeBranch : ''}
        `}
      >
        {/* Drag Handle (Not allowed on branches) */}
        {!isBranch && (
          <div ref={dragHandle} className={styles.dragHandle}>
            <GripVertical size={14} />
          </div>
        )}
        
        {/* Indentation for branches to visually align them */}
        {isBranch && <div className={styles.branchIndentIndicator} />}

        {/* Expand/Collapse Toggle */}
        <div className={styles.toggle} onClick={handleToggle}>
          {node.isInternal ? (
             node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span style={{ width: 14 }} /> // Spacer for alignment
          )}
        </div>

        {/* Icon */}
        <div className={styles.icon}>
          {isAction && <Zap size={14} />}
          {isCondition && <HelpCircle size={14} />}
          {isBranch && <span className={styles.branchLineIcon}>↳</span>}
        </div>

        {/* Title / Template Renderer */}
        <div className={styles.title}>
          {isBranch ? (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span>{branchName}</span>
              {(!node.children || node.children.length === 0) && (
                <span style={{ opacity: 0.5, fontStyle: 'italic', marginLeft: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {node.data.type === 'branch_conditions' ? 'No conditions...' : 'Do nothing...'}
                </span>
              )}
            </div>
          ) : (() => {
            const blueprint = isAction 
              ? actionBlueprints[node.data.blueprintId!] 
              : isCondition 
                ? conditionalBlueprints[node.data.blueprintId!] 
                : null;
                
            if (blueprint && context) {
              return (
                <BlueprintRenderer 
                  template={blueprint.template} 
                  params={node.data.params || {}} 
                  onChangeParam={(k, v) => context.updateNodeParams(node.id, { [k]: v })}
                />
              );
            }
            return node.data.name;
          })()}
        </div>

        {/* Actions */}
        {!isBranch && (
          <button className={styles.deleteButton} onClick={handleDelete} title="Delete">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
