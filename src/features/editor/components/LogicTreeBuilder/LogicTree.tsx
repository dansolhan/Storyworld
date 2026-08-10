import React, { useRef, useState, useEffect } from 'react';
import { LogicTreeContext } from './logicTreeContext';
import { Tree, TreeApi } from 'react-arborist';
import type { MoveHandler, NodeApi } from 'react-arborist';
import type { LogicNode, DraggedToolboxItem } from './types';
import { actionBlueprints } from '../../../../domain/Actions/registry';
import { conditionalBlueprints } from '../../../../domain/Conditionals/registry';
import { LogicTreeNode } from './LogicTreeNode';
import styles from './LogicTree.module.css';

interface LogicTreeProps {
  data: LogicNode[];
  onChange: (data: LogicNode[]) => void;
}

const generateId = () => crypto.randomUUID();


export const LogicTree: React.FC<LogicTreeProps> = ({ data, onChange }) => {
  const treeRef = useRef<TreeApi<LogicNode>>(null);
  const [dndRoot, setDndRoot] = useState<HTMLDivElement | null>(null);

  // Handle native drag over to allow dropping from toolbox
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // Only intercept if it's our toolbox item
    if (e.dataTransfer.types.includes('application/storyworld-item')) {
      e.preventDefault(); // crucial to allow drop
      e.stopPropagation(); // prevent arborist from seeing it
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  // Handle dropping an item from the toolbox onto the tree area
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('application/storyworld-item')) {
      return; // Let arborist handle its own drops
    }
    
    e.preventDefault();
    e.stopPropagation();
    console.log('Drop event fired');
    const tree = treeRef.current;
    if (!tree) return;

    try {
      const draggedDataString = e.dataTransfer.getData('application/storyworld-item');
      console.log('Dropped JSON string:', draggedDataString);
      if (!draggedDataString) return;

      const draggedItem: DraggedToolboxItem = JSON.parse(draggedDataString);
      console.log('Parsed item:', draggedItem);

      const blueprint = draggedItem.type === 'action' 
        ? actionBlueprints[draggedItem.blueprintId] 
        : conditionalBlueprints[draggedItem.blueprintId];
      
      const params = blueprint ? JSON.parse(JSON.stringify(blueprint.defaultParams)) : {};
      if (draggedItem.blueprintId === 'post_message') {
        params.messageLocId = crypto.randomUUID();
      }

      // Create the new node structure based on type
      const newNode: LogicNode = {
        id: generateId(),
        type: draggedItem.type,
        name: draggedItem.name,
        blueprintId: draggedItem.blueprintId,
        params
      };

      const newData = JSON.parse(JSON.stringify(data)) as LogicNode[];

      const targetElement = (e.target as Element).closest('[data-id]');
      const targetId = targetElement ? targetElement.getAttribute('data-id') : null;

      const findNode = (list: LogicNode[], id: string): LogicNode | null => {
        for (const n of list) {
          if (n.id === id) return n;
          if (n.children) {
            const f = findNode(n.children, id);
            if (f) return f;
          }
        }
        return null;
      };

      const findParentOf = (list: LogicNode[], childId: string): LogicNode | null => {
        for (const n of list) {
          if (n.children?.some(c => c.id === childId)) return n;
          if (n.children) {
            const p = findParentOf(n.children, childId);
            if (p) return p;
          }
        }
        return null;
      };

      let droppedIntoTarget = false;
      let targetNode: LogicNode | null = null;

      if (targetId) {
        targetNode = findNode(newData, targetId);
        if (targetNode && targetNode.type !== 'branch_then' && targetNode.type !== 'branch_else' && targetNode.type !== 'branch_conditions') {
            targetNode = findParentOf(newData, targetId);
        }
      }

      const isGroup = draggedItem.blueprintId === 'and_group' || draggedItem.blueprintId === 'or_group';

      if (isGroup) {
        newNode.children = [
          { id: generateId(), type: 'branch_conditions', name: 'Conditions', children: [] },
          { id: generateId(), type: 'branch_then', name: 'Then', children: [] },
          { id: generateId(), type: 'branch_else', name: 'Else', children: [] }
        ];
      } else if (draggedItem.type === 'condition') {
        const isTargetConditionsList = targetNode && targetNode.type === 'branch_conditions';
        if (!isTargetConditionsList) {
          newNode.children = [
            { id: generateId(), type: 'branch_then', name: 'Then', children: [] },
            { id: generateId(), type: 'branch_else', name: 'Else', children: [] }
          ];
        }
      }

      if (targetNode && (targetNode.type === 'branch_then' || targetNode.type === 'branch_else' || targetNode.type === 'branch_conditions')) {
        // Enforce conditions strictly dropping into branch_conditions when placed into groups
        // Actually, internal rules say actions go in Then/Else, conditions go in branch_conditions or root nodes
        // If we drop draggedItem into target, we just push it
        if (!targetNode.children) targetNode.children = [];
        targetNode.children.push(newNode);
        droppedIntoTarget = true;
      }

      if (!droppedIntoTarget) {
        // We append it to the root of the tree.
        newData.push(newNode);
      }
      
      console.log('New data array:', newData);
      onChange(newData);
      
    } catch (err) {
      console.error("Failed to parse dropped item", err);
    }
  };

  // Handle internal reordering inside the tree
  const handleMove: MoveHandler<LogicNode> = ({ dragIds, parentId, index }) => {
    // Validate the move. 
    // We shouldn't drag branch_then/branch_else nodes.
    const draggedNodes = data.flatMap(d => findNodes(d, dragIds));
    if (draggedNodes.some(n => n?.type === 'branch_then' || n?.type === 'branch_else')) {
      return;
    }

    // Since onChange is required to persist the move in controlled mode, we need to manually update our data structure.
    // Reassigned below: extractNodes replaces the whole array with the filtered one.
    let newData = JSON.parse(JSON.stringify(data)) as LogicNode[];

    // Check if target is a branch_conditions list
    let isMovingIntoConditionsList = false;

    const findNodeById = (list: LogicNode[], id: string): LogicNode | null => {
      for (const node of list) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNodeById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    if (parentId !== null) {
      const targetParent = findNodeById(newData, parentId);
      if (targetParent && targetParent.type === 'branch_conditions') {
        isMovingIntoConditionsList = true;
      }
    }

    // 1. Remove dragged nodes from their old positions
    const extractNodes = (nodesToExtractFrom: LogicNode[], ids: string[]): LogicNode[] => {
      const extracted: LogicNode[] = [];
      const filterNodes = (list: LogicNode[]) => {
        return list.filter(node => {
          if (ids.includes(node.id)) {
            extracted.push(node);
            return false;
          }
          if (node.children) {
            node.children = filterNodes(node.children);
          }
          return true;
        });
      };
      newData = filterNodes(nodesToExtractFrom);
      return extracted;
    };

    const movingNodes = extractNodes(newData, dragIds);

    // Filter moving nodes to strip or add their Then/Else sub-branches dynamically based on their new destination
    movingNodes.forEach(node => {
      if (node.type === 'condition') {
        const isNodeGroup = node.blueprintId === 'and_group' || node.blueprintId === 'or_group';

        if (isMovingIntoConditionsList) {
          // Strip Then and Else
          if (node.children) {
            node.children = node.children.filter(c => c.type !== 'branch_then' && c.type !== 'branch_else');
          }
        } else {
          // Add Then and Else if missing
          if (!node.children) node.children = [];
          const hasThen = node.children.some(c => c.type === 'branch_then');
          const hasElse = node.children.some(c => c.type === 'branch_else');
          if (!hasThen) node.children.push({ id: generateId(), type: 'branch_then', name: 'Then', children: [] });
          if (!hasElse) node.children.push({ id: generateId(), type: 'branch_else', name: 'Else', children: [] });
        }

        // Always ensure Groups have branch_conditions
        if (isNodeGroup) {
          if (!node.children) node.children = [];
          const hasConds = node.children.some(c => c.type === 'branch_conditions');
          if (!hasConds) {
            node.children.unshift({ id: generateId(), type: 'branch_conditions', name: 'Conditions', children: [] });
          }
        }

        // Always Sort
        if (node.children) {
          node.children.sort((a, b) => {
             const weight = (t: string) => {
               if (t === 'branch_conditions') return 1;
               if (t === 'branch_then') return 2;
               if (t === 'branch_else') return 3;
               return 0;
             };
             return weight(a.type) - weight(b.type);
          });

          // Delete children array if perfectly empty, this strictly removes the folder chevron UI
          if (node.children.length === 0) {
            delete node.children;
          }
        }
      }
    });

    // 2. Insert into new position
    const insertNodes = (nodesToInsertInto: LogicNode[], targetParentId: string | null, targetIndex: number, moving: LogicNode[]) => {
      if (targetParentId === null) {
        nodesToInsertInto.splice(targetIndex, 0, ...moving);
        return;
      }
      
      const insert = (list: LogicNode[]) => {
        for (const node of list) {
          if (node.id === targetParentId) {
            if (!node.children) node.children = [];
            node.children.splice(targetIndex, 0, ...moving);
            return true;
          }
          if (node.children && insert(node.children)) {
            return true;
          }
        }
        return false;
      };
      insert(nodesToInsertInto);
    };

    insertNodes(newData, parentId, index, movingNodes);
    onChange(newData);
  };

  // Helper to find a node by ID
  const findNodes = (node: LogicNode, ids: string[]): (LogicNode | undefined)[] => {
    let found: (LogicNode | undefined)[] = [];
    if (ids.includes(node.id)) found.push(node);
    if (node.children) {
      node.children.forEach(c => {
         found = [...found, ...findNodes(c, ids)];
      });
    }
    return found;
  };

  // Only allow dropping into root or branch folders or AND/OR groups
  const disableDrop = (args: { parentNode: NodeApi<LogicNode> | null, index: number }) => {
    // If dropping at root level (parentNode is null) -> allow
    if (!args.parentNode) return false;
    
    // Only allow dropping inside branches
    const parentType = args.parentNode.data.type;

    // Disallow drops unless the parent is a branch (Then/Else or Conditions)
    if (parentType !== 'branch_then' && parentType !== 'branch_else' && parentType !== 'branch_conditions') {
      return true; // Disable drop
    }
    
    return false; // Allow drop
  };

  // Prevent dragging branches themselves
  const disableDrag = (node: { data?: { type?: string }; type?: string }) => {
     const type = node.data?.type || node.type; // Fallback in case it actually passes LogicNode at runtime
     return type === 'branch_then' || type === 'branch_else' || type === 'branch_conditions';
  };

  const updateNodeParams = (nodeId: string, params: Record<string, unknown>) => {
    const newData = JSON.parse(JSON.stringify(data)) as LogicNode[];
    const update = (list: LogicNode[]) => {
      for (const node of list) {
        if (node.id === nodeId) {
          node.params = { ...node.params, ...params };
          return true;
        }
        if (node.children && update(node.children)) {
          return true;
        }
      }
      return false;
    };
    if (update(newData)) {
      onChange(newData);
    }
  };

  const [width, setWidth] = useState(0);

  // Use a ResizeObserver to sync the container width to Tree
  useEffect(() => {
    if (!dndRoot) return;

    // ResizeObserver reports the current size on observe, so the initial
    // measurement arrives through the callback rather than a synchronous
    // setState in the effect body.
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(dndRoot);

    return () => observer.disconnect();
  }, [dndRoot]);

  const countNodes = (nodes: LogicNode[]): number => {
    let count = nodes.length;
    nodes.forEach(node => {
      if (node.children) {
        count += countNodes(node.children);
      }
    });
    return count;
  };

  const totalHeight = Math.max(120, countNodes(data) * 46 + 20);

  return (
    <div 
      ref={setDndRoot}
      className={styles.treeContainer}
      onDragOverCapture={handleDragOver}
      onDropCapture={handleDrop}
      style={{ height: totalHeight }}
    >
      {data.length === 0 && (
         <div className={styles.emptyState}>
            Drag items here...
         </div>
      )}
      {dndRoot && width > 0 && (
        <LogicTreeContext.Provider value={{ updateNodeParams }}>
          <Tree
            ref={treeRef}
            dndRootElement={dndRoot}
            data={data}
            openByDefault={true}
            width={width}
            height={totalHeight}
            indent={24}
            rowHeight={46} // 38px + 8px margin roughly
            onMove={handleMove}
            onDelete={(args) => {
              // Remove from tree
              const newData = JSON.parse(JSON.stringify(data)) as LogicNode[];
              const filterNodes = (list: LogicNode[]) => {
                return list.filter(node => {
                  if (args.ids.includes(node.id)) {
                    return false;
                  }
                  if (node.children) {
                    node.children = filterNodes(node.children);
                  }
                  return true;
                });
              };
              onChange(filterNodes(newData));
            }}
            disableDrop={disableDrop}
            disableDrag={disableDrag}
          >
            {LogicTreeNode}
          </Tree>
        </LogicTreeContext.Provider>
      )}
    </div>
  );
};
