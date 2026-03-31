import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { type StoryEvent, AVAILABLE_EVENTS } from '../../../../domain/Events/StoryEvent';
import { LogicTree } from '../LogicTreeBuilder/LogicTree';
import { LogicToolbox } from '../LogicTreeBuilder/LogicToolbox';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import styles from './EventsEditor.module.css';

interface EventsEditorProps {
  targetType: 'page' | 'choice' | 'paragraph';
  pageId: string;
  targetId: string;
  events: StoryEvent[];
}

export const EventsEditor: React.FC<EventsEditorProps> = ({
  targetType,
  pageId,
  targetId,
  events,
}) => {
  const { addEvent, updateEvent, removeEvent, updateEventLogicTree } = useEditorStore();
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set(events.map(e => e.id)));

  const availableEvents = React.useMemo(() => {
    return AVAILABLE_EVENTS.filter(e => !e.domainContext || e.domainContext.includes(targetType));
  }, [targetType]);

  const defaultEventName = availableEvents.length > 0 ? availableEvents[0].name : 'onEnter';

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>Events ({events.length})</span>
        {availableEvents.length > 0 && (
          <button 
            className={styles.miniAddBtn}
            onClick={() => addEvent(targetType, pageId, targetId, defaultEventName)}
            title="Add Event"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      <div className={styles.eventsList}>
        {events.map((evt) => {
          const isExpanded = expandedIds.has(evt.id);
          
          return (
            <div key={evt.id} className={styles.eventCard}>
              <div className={styles.eventHeader}>
                <button 
                  className={styles.chevronBtn}
                  onClick={() => toggleExpand(evt.id)}
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <select
                  className={styles.nameInput}
                  value={evt.name}
                  onChange={(e) => updateEvent(targetType, pageId, targetId, evt.id, { name: e.target.value })}
                >
                  {availableEvents.map(e => (
                    <option key={e.name} value={e.name}>{e.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className={styles.commentInput}
                  value={evt.comment || ''}
                  onChange={(e) => updateEvent(targetType, pageId, targetId, evt.id, { comment: e.target.value })}
                  placeholder="Optional comment..."
                />
                <button
                  className={styles.deleteBtn}
                  onClick={() => removeEvent(targetType, pageId, targetId, evt.id)}
                  title="Delete Event"
                >
                  ×
                </button>
              </div>
              
              {isExpanded && (
                <div className={styles.eventBody}>
                  <div className={styles.toolboxSection}>
                     <LogicToolbox 
                       domainContext={targetType}
                       eventContext={evt.name}
                     />
                  </div>
                  <div className={styles.logicSection}>
                    <LogicTree
                      data={evt.logicTree || []}
                      onChange={(newData) => updateEventLogicTree(targetType, pageId, targetId, evt.id, newData)}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
