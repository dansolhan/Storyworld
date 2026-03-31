import type { StoryData } from '../StoryData';

export const CURRENT_VERSION = '1.1.0';

type MigrationFunction = (oldStory: any) => any;

const migrateV1_0_0_to_V1_1_0: MigrationFunction = (v1Story) => {
  // Version 1.1.0 renames:
  // - onEvaluate -> calculateVisibility (for pages, paragraphs, and choices)
  // - onEnter -> onSelect (for choices only)
  // - Automates adding "hide" actions to failed calculateVisibility conditions to match legacy behavior

  const upgradeLogicTree = (tree: any[], hideBlueprintId: string) => {
    if (!tree) return;
    for (const node of tree) {
      if (node.type === 'condition') {
        const children = node.children || [];
        let branchElse = children.find((c: any) => c.type === 'branch_else');
        
        if (!branchElse) {
          branchElse = {
            id: crypto.randomUUID(),
            type: 'branch_else',
            name: 'Else',
            children: []
          };
          node.children = [...children, branchElse];
        }

        if (!branchElse.children) branchElse.children = [];
        
        const hasHide = branchElse.children.some((c: any) => 
          c.type === 'action' && (c.blueprintId === 'hide_paragraph' || c.blueprintId === 'hide_choice')
        );

        if (!hasHide) {
          branchElse.children.push({
            id: crypto.randomUUID(),
            type: 'action',
            name: hideBlueprintId === 'hide_paragraph' ? 'Hide Paragraph' : 'Hide Choice',
            blueprintId: hideBlueprintId,
            params: {}
          });
        }
      }
    }
  };

  const pages = (v1Story.pages || []).map((page: any) => {
    const p = { ...page };
    
    const migrateEvents = (item: any, domain: 'page' | 'paragraph' | 'choice') => {
      if (!item.events) return item;
      const hideBlueprintId = domain === 'choice' ? 'hide_choice' : 'hide_paragraph';

      return {
        ...item,
        events: item.events.map((evt: any) => {
          let newName = evt.name;
          if (newName === 'onEvaluate') {
            newName = 'calculateVisibility';
          }
          if (domain === 'choice' && (newName === 'onEnter' || newName === 'onClick')) {
            newName = 'onSelect';
          }
          
          const newEvt = { ...evt, name: newName };
          if (newName === 'calculateVisibility') {
            upgradeLogicTree(newEvt.logicTree, hideBlueprintId);
          }
          return newEvt;
        })
      };
    };

    const migratedPage = migrateEvents(p, 'page');
    migratedPage.paragraphs = (migratedPage.paragraphs || []).map((para: any) => migrateEvents(para, 'paragraph'));
    migratedPage.choices = (migratedPage.choices || []).map((choice: any) => migrateEvents(choice, 'choice'));
    
    return migratedPage;
  });

  return { ...v1Story, pages };
};

const migrateV1ToV2: MigrationFunction = (v1Story) => {
  // Version 2 introduces uiMetadata containing nodePositions for Editor layout.
  return {
    ...v1Story,
  };
};

const migrateV2ToV3: MigrationFunction = (v2Story) => {
  // Version 3 introduces subplots.
  return {
    ...v2Story,
    subplots: v2Story.subplots || [],
  };
};

const migrateV3ToV4: MigrationFunction = (v3Story) => {
  // Version 4 changes:
  // - Choice.targetPageId becomes optional (undefined) instead of empty string.
  //   Any choice with targetPageId === '' is normalised to undefined so that
  //   action-only choices can be cleanly distinguished from wired-up choices.
  // - Actions gain an optional `trigger` field ('on_enter' | 'on_exit').
  //   Existing actions without a trigger default to 'on_enter' at runtime,
  //   so no explicit field needs to be written here (undefined === on_enter).
  const pages = (v3Story.pages || []).map((page: any) => ({
    ...page,
    choices: (page.choices || []).map((choice: any) => ({
      ...choice,
      targetPageId: choice.targetPageId || undefined,
    })),
  }));

  return {
    ...v3Story,
    pages,
  };
};

const migrateV4ToV5: MigrationFunction = (v4Story) => {
  // Version 5 converts Record<string, string> variables to Record<string, { type: 'string' | 'number' | 'boolean', value: any }>
  const migratedVariables: Record<string, any> = {};

  if (v4Story.variables) {
    for (const [key, value] of Object.entries(v4Story.variables)) {
      if (typeof value === 'object' && value !== null && 'type' in value) {
        // Already migrated or structurally valid
        migratedVariables[key] = value;
      } else {
        // Old string variable
        migratedVariables[key] = {
          type: 'string', // Default to string for old variables
          value: value
        };
      }
    }
  }

  return {
    ...v4Story,
    variables: migratedVariables
  };
};

const migrateV5ToV6: MigrationFunction = (v5Story) => {
  // Version 6 adds `tags?: string[]` to variables.
  const migratedVariables: Record<string, any> = {};

  if (v5Story.variables) {
    for (const [key, value] of Object.entries(v5Story.variables)) {
      if (typeof value === 'object' && value !== null) {
        migratedVariables[key] = {
          ...value,
          tags: (value as any).tags || []
        };
      } else {
        migratedVariables[key] = value;
      }
    }
  }

  return {
    ...v5Story,
    variables: migratedVariables
  };
};

const migrateV6ToV7: MigrationFunction = (v6Story) => {
  // Version 7 adds audio and atmospheres to the story root.
  return {
    ...v6Story,
    audio: v6Story.audio || {},
    atmospheres: v6Story.atmospheres || {}
  };
};

const migrateV7ToV8: MigrationFunction = (v7Story) => {
  // Version 8 adds items to the story root.
  return {
    ...v7Story,
    items: v7Story.items || {}
  };
};

const mapLegacyAction = (a: any) => ({
  id: a.id || crypto.randomUUID(),
  type: 'action',
  name: a.blueprintId || 'Action',
  blueprintId: a.blueprintId,
  params: a.params || {}
});

const mapLegacyConditional = (c: any): any => {
  const isGroup = c.blueprintId === 'and_group' || c.blueprintId === 'or_group';
  const node: any = {
    id: c.id || crypto.randomUUID(),
    type: 'condition',
    name: c.blueprintId || 'Condition',
    blueprintId: c.blueprintId,
    params: c.params || {},
  };
  
  if (isGroup) {
    node.children = [
      {
        id: crypto.randomUUID(),
        type: 'branch_conditions',
        name: 'Conditions',
        children: (c.children || []).map(mapLegacyConditional)
      },
      { id: crypto.randomUUID(), type: 'branch_then', name: 'Then', children: [] },
      { id: crypto.randomUUID(), type: 'branch_else', name: 'Else', children: [] }
    ];
  } else {
    node.children = [
      { id: crypto.randomUUID(), type: 'branch_then', name: 'Then', children: [] },
      { id: crypto.randomUUID(), type: 'branch_else', name: 'Else', children: [] }
    ];
  }
  return node;
};

const migrateV0_9_0_to_V1_0_0: MigrationFunction = (v0_9_story) => {
  // Version 1.0.0 replaces actions/conditionals with a unified events array carrying Logic Trees
  const migrateItem = (item: any) => {
    const events: any[] = [];

    if (item.conditionals && item.conditionals.length > 0) {
       events.push({
         id: crypto.randomUUID(),
         name: 'onEvaluate',
         logicTree: item.conditionals.map(mapLegacyConditional)
       });
    }

    if (item.actions && item.actions.length > 0) {
       events.push({
         id: crypto.randomUUID(),
         name: 'onEnter',
         logicTree: item.actions.map(mapLegacyAction)
       });
    }

    const { actions, conditionals, ...rest } = item;
    if (events.length > 0) {
      rest.events = events;
    }
    return rest;
  };

  const pages = (v0_9_story.pages || []).map((page: any) => {
    const p = migrateItem(page);
    p.choices = (p.choices || []).map(migrateItem);
    p.paragraphs = (p.paragraphs || []).map(migrateItem);
    return p;
  });

  return { ...v0_9_story, pages };
};

interface MigrationStep {
  from: string | number;
  to: string | number;
  migrate: MigrationFunction;
}

const migrationSteps: MigrationStep[] = [
  { from: 1, to: 2, migrate: migrateV1ToV2 },
  { from: 2, to: 3, migrate: migrateV2ToV3 },
  { from: 3, to: 4, migrate: migrateV3ToV4 },
  { from: 4, to: 5, migrate: migrateV4ToV5 },
  { from: 5, to: 6, migrate: migrateV5ToV6 },
  { from: 6, to: 7, migrate: migrateV6ToV7 },
  { from: 7, to: 8, migrate: migrateV7ToV8 },
  { from: 8, to: '0.8.0', migrate: (story) => ({ ...story }) },
  { from: '0.8.0', to: '0.9.0', migrate: (story) => ({ ...story }) },
  { from: '0.9.0', to: '1.0.0', migrate: migrateV0_9_0_to_V1_0_0 },
  { from: '1.0.0', to: '1.1.0', migrate: migrateV1_0_0_to_V1_1_0 },
];

export function migrateStory(storyJson: any): StoryData {
  if (!storyJson) throw new Error('Cannot migrate undefined or null story structure.');

  let migratedStory =
    typeof structuredClone === 'function'
      ? structuredClone(storyJson)
      : JSON.parse(JSON.stringify(storyJson));

  let currentVersion = migratedStory.version || 1;

  let step = migrationSteps.find((s) => s.from === currentVersion);

  while (step && currentVersion !== CURRENT_VERSION) {
    migratedStory = step.migrate(migratedStory);
    currentVersion = step.to;
    step = migrationSteps.find((s) => s.from === currentVersion);
  }

  if (currentVersion !== CURRENT_VERSION) {
    throw new Error(`Missing migration script to step from version ${currentVersion} to ${CURRENT_VERSION}`);
  }

  migratedStory.version = CURRENT_VERSION;
  return migratedStory as StoryData;
}
