import React, { useState } from 'react';
import { actionBlueprints } from '../../../../domain/Actions/registry';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import type { DraggedToolboxItem, LogicNodeType } from './types';
import { Zap, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import styles from './LogicToolbox.module.css';

interface LogicToolboxProps {
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, item: DraggedToolboxItem) => void;
}

export const LogicToolbox: React.FC<LogicToolboxProps> = ({ onDragStart }) => {
  const [conditionsOpen, setConditionsOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, type: LogicNodeType, blueprintId: string, name: string) => {
    console.log('Drag Start:', { type, blueprintId, name });
    if (onDragStart) {
      onDragStart(e, { type, blueprintId, name });
    }
    
    // Set data for native HTML5 drag and drop
    e.dataTransfer.setData('application/storyworld-item', JSON.stringify({ type, blueprintId, name }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className={styles.toolbox}>
      <div className={styles.submenu}>
        <div 
          className={styles.submenuHeader} 
          onClick={() => setConditionsOpen(!conditionsOpen)}
        >
          <h3 className={styles.categoryTitle}>Conditions</h3>
          {conditionsOpen ? <ChevronDown size={16} className={styles.chevron} /> : <ChevronRight size={16} className={styles.chevron} />}
        </div>
        
        {conditionsOpen && (
          <div className={styles.categoryList}>
            {Object.values(conditionalBlueprints).map((bp) => (
              <div
                key={bp.id}
                className={`${styles.toolboxItem} ${styles.typeCondition}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, 'condition', bp.id, bp.name)}
              >
                <HelpCircle size={16} />
                <span>{bp.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.submenu}>
        <div 
          className={styles.submenuHeader} 
          onClick={() => setActionsOpen(!actionsOpen)}
        >
          <h3 className={styles.categoryTitle}>Actions</h3>
          {actionsOpen ? <ChevronDown size={16} className={styles.chevron} /> : <ChevronRight size={16} className={styles.chevron} />}
        </div>
        
        {actionsOpen && (
          <div className={styles.categoryList}>
            {Object.values(actionBlueprints).map((bp) => (
              <div
                key={bp.id}
                className={`${styles.toolboxItem} ${styles.typeAction}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, 'action', bp.id, bp.name)}
              >
                <Zap size={16} />
                <span>{bp.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
