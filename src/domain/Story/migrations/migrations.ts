import type { StoryData } from '../StoryData';
import {
  type LegacyRecord,
  ensurePagesArray,
  isRecord,
  optionalString,
  paramsOf,
  recordList,
} from './legacyStory';

export const CURRENT_VERSION = '1.2.0';

type MigrationFunction = (oldStory: LegacyRecord) => LegacyRecord;

const newId = (): string => crypto.randomUUID();

const migrateV1_0_0_to_V1_1_0: MigrationFunction = (v1Story) => {
  // Version 1.1.0 renames:
  // - onEvaluate -> calculateVisibility (for pages, paragraphs, and choices)
  // - onEnter -> onSelect (for choices only)
  // - Automates adding "hide" actions to failed calculateVisibility conditions to match legacy behavior

  const upgradeLogicTree = (tree: unknown, hideBlueprintId: string): void => {
    for (const node of recordList(tree)) {
      if (node.type !== 'condition') continue;

      const children = recordList(node.children);
      let branchElse = children.find((child) => child.type === 'branch_else');

      if (!branchElse) {
        branchElse = { id: newId(), type: 'branch_else', name: 'Else', children: [] };
        node.children = [...children, branchElse];
      }

      const elseChildren = recordList(branchElse.children);
      const hasHide = elseChildren.some(
        (child) =>
          child.type === 'action' &&
          (child.blueprintId === 'hide_paragraph' || child.blueprintId === 'hide_choice')
      );

      if (!hasHide) {
        // Mutates the same object that sits in the tree, whether it was found or just created.
        branchElse.children = [
          ...elseChildren,
          {
            id: newId(),
            type: 'action',
            name: hideBlueprintId === 'hide_paragraph' ? 'Hide Paragraph' : 'Hide Choice',
            blueprintId: hideBlueprintId,
            params: {},
          },
        ];
      }
    }
  };

  const migrateEvents = (
    item: LegacyRecord,
    domain: 'page' | 'paragraph' | 'choice'
  ): LegacyRecord => {
    if (!item.events) return item;
    const hideBlueprintId = domain === 'choice' ? 'hide_choice' : 'hide_paragraph';

    return {
      ...item,
      events: recordList(item.events).map((event) => {
        let name = event.name;
        if (name === 'onEvaluate') {
          name = 'calculateVisibility';
        }
        if (domain === 'choice' && (name === 'onEnter' || name === 'onClick')) {
          name = 'onSelect';
        }

        const migrated: LegacyRecord = { ...event, name };
        if (name === 'calculateVisibility') {
          upgradeLogicTree(migrated.logicTree, hideBlueprintId);
        }
        return migrated;
      }),
    };
  };

  const pages = ensurePagesArray(v1Story.pages).map((page) => {
    const migratedPage = migrateEvents({ ...page }, 'page');
    migratedPage.paragraphs = recordList(migratedPage.paragraphs).map((paragraph) =>
      migrateEvents(paragraph, 'paragraph')
    );
    migratedPage.choices = recordList(migratedPage.choices).map((choice) =>
      migrateEvents(choice, 'choice')
    );
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
    subplots: Array.isArray(v2Story.subplots) ? v2Story.subplots : [],
  };
};

const migrateV3ToV4: MigrationFunction = (v3Story) => {
  // Version 4 changes:
  // - Choice.targetPageId becomes optional (undefined) instead of empty string.
  //   Any choice with targetPageId === '' is normalised to undefined so that
  //   action-only choices can be cleanly distinguished from wired-up choices.
  const pages = ensurePagesArray(v3Story.pages).map((page) => ({
    ...page,
    choices: recordList(page.choices).map((choice) => ({
      ...choice,
      targetPageId: optionalString(choice.targetPageId) || undefined,
    })),
  }));

  return {
    ...v3Story,
    pages,
  };
};

const migrateV4ToV5: MigrationFunction = (v4Story) => {
  // Version 5 converts Record<string, string> variables to
  // Record<string, { type: 'string' | 'number' | 'boolean', value: unknown }>
  const migratedVariables: LegacyRecord = {};

  if (isRecord(v4Story.variables)) {
    for (const [key, value] of Object.entries(v4Story.variables)) {
      if (isRecord(value) && 'type' in value) {
        // Already migrated or structurally valid
        migratedVariables[key] = value;
      } else {
        // Old string variable
        migratedVariables[key] = {
          type: 'string', // Default to string for old variables
          value,
        };
      }
    }
  }

  return {
    ...v4Story,
    variables: migratedVariables,
  };
};

const migrateV5ToV6: MigrationFunction = (v5Story) => {
  // Version 6 adds `tags?: string[]` to variables.
  const migratedVariables: LegacyRecord = {};

  if (isRecord(v5Story.variables)) {
    for (const [key, value] of Object.entries(v5Story.variables)) {
      if (isRecord(value)) {
        migratedVariables[key] = {
          ...value,
          tags: Array.isArray(value.tags) ? value.tags : [],
        };
      } else {
        migratedVariables[key] = value;
      }
    }
  }

  return {
    ...v5Story,
    variables: migratedVariables,
  };
};

const migrateV6ToV7: MigrationFunction = (v6Story) => {
  // Version 7 adds audio and atmospheres to the story root.
  return {
    ...v6Story,
    audio: isRecord(v6Story.audio) ? v6Story.audio : {},
    atmospheres: isRecord(v6Story.atmospheres) ? v6Story.atmospheres : {},
  };
};

const migrateV7ToV8: MigrationFunction = (v7Story) => {
  // Version 8 adds items to the story root.
  return {
    ...v7Story,
    items: isRecord(v7Story.items) ? v7Story.items : {},
  };
};

const mapLegacyAction = (action: LegacyRecord): LegacyRecord => ({
  id: optionalString(action.id) ?? newId(),
  type: 'action',
  name: optionalString(action.blueprintId) ?? 'Action',
  blueprintId: action.blueprintId,
  params: paramsOf(action.params),
});

const branchNode = (type: string, name: string): LegacyRecord => ({
  id: newId(),
  type,
  name,
  children: [],
});

const mapLegacyConditional = (conditional: LegacyRecord): LegacyRecord => {
  const isGroup =
    conditional.blueprintId === 'and_group' || conditional.blueprintId === 'or_group';

  return {
    id: optionalString(conditional.id) ?? newId(),
    type: 'condition',
    name: optionalString(conditional.blueprintId) ?? 'Condition',
    blueprintId: conditional.blueprintId,
    params: paramsOf(conditional.params),
    children: isGroup
      ? [
          {
            ...branchNode('branch_conditions', 'Conditions'),
            children: recordList(conditional.children).map(mapLegacyConditional),
          },
          branchNode('branch_then', 'Then'),
          branchNode('branch_else', 'Else'),
        ]
      : [branchNode('branch_then', 'Then'), branchNode('branch_else', 'Else')],
  };
};

const migrateV0_9_0_to_V1_0_0: MigrationFunction = (v0_9_story) => {
  // Version 1.0.0 replaces actions/conditionals with a unified events array carrying Logic Trees
  const migrateItem = (item: LegacyRecord): LegacyRecord => {
    const events: LegacyRecord[] = [];
    const legacyConditionals = recordList(item.conditionals);
    const legacyActions = recordList(item.actions);

    if (legacyConditionals.length > 0) {
      events.push({
        id: newId(),
        name: 'onEvaluate',
        logicTree: legacyConditionals.map(mapLegacyConditional),
      });
    }

    if (legacyActions.length > 0) {
      events.push({
        id: newId(),
        name: 'onEnter',
        logicTree: legacyActions.map(mapLegacyAction),
      });
    }

    // `actions` and `conditionals` are dropped by being named here.
    const { actions, conditionals, ...rest } = item;
    if (events.length > 0) {
      rest.events = events;
    }
    return rest;
  };

  const pages = ensurePagesArray(v0_9_story.pages).map((page) => {
    const migratedPage = migrateItem(page);
    migratedPage.choices = recordList(migratedPage.choices).map(migrateItem);
    migratedPage.paragraphs = recordList(migratedPage.paragraphs).map(migrateItem);
    return migratedPage;
  });

  return { ...v0_9_story, pages };
};

/**
 * Status-data visibility becomes a logic tree, like every other condition.
 *
 * Deliberately written against `LegacyRecord` rather than importing
 * `conditionalsToLogicTree`: a migration is frozen history and has to keep
 * producing the shape that *this* version expected, even after the domain types
 * move on again. Importing today's adapter would silently re-point this hop at a
 * future shape and corrupt the chain for anyone upgrading through it.
 */
const migrateV1_1_0_to_V1_2_0: MigrationFunction = (v1_1_story) => {
  const toLogicNode = (conditional: LegacyRecord): LegacyRecord => {
    const node: LegacyRecord = {
      id: optionalString(conditional.id) ?? newId(),
      type: 'condition',
      name: optionalString(conditional.blueprintId) ?? 'condition',
      blueprintId: optionalString(conditional.blueprintId),
      params: paramsOf(conditional.params),
    };

    const children = recordList(conditional.children);
    if (children.length > 0) {
      // Group blueprints read their operands from this branch, not from `children`.
      node.children = [
        {
          id: `${node.id as string}-conditions`,
          type: 'branch_conditions',
          name: 'Conditions',
          children: children.map(toLogicNode),
        },
      ];
    }

    return node;
  };

  const statusData = recordList(v1_1_story.statusData).map((entry) => {
    const legacyConditions = recordList(entry.conditionals);
    // `conditionals` is dropped by being named here.
    const { conditionals, ...rest } = entry;
    void conditionals;

    if (legacyConditions.length > 0) {
      rest.condition = legacyConditions.map(toLogicNode);
    }
    return rest;
  });

  return { ...v1_1_story, statusData };
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
  { from: '1.1.0', to: '1.2.0', migrate: migrateV1_1_0_to_V1_2_0 },
];

export function migrateStory(storyJson: unknown): StoryData {
  if (!isRecord(storyJson)) {
    throw new Error('Cannot migrate undefined or null story structure.');
  }

  let migratedStory: LegacyRecord =
    typeof structuredClone === 'function'
      ? structuredClone(storyJson)
      : (JSON.parse(JSON.stringify(storyJson)) as LegacyRecord);

  let currentVersion: string | number =
    typeof migratedStory.version === 'string' || typeof migratedStory.version === 'number'
      ? migratedStory.version
      : 1;

  let step = migrationSteps.find((s) => s.from === currentVersion);

  while (step && currentVersion !== CURRENT_VERSION) {
    migratedStory = step.migrate(migratedStory);
    currentVersion = step.to;
    step = migrationSteps.find((s) => s.from === currentVersion);
  }

  if (currentVersion !== CURRENT_VERSION) {
    throw new Error(
      `Missing migration script to step from version ${currentVersion} to ${CURRENT_VERSION}`
    );
  }

  migratedStory.version = CURRENT_VERSION;
  return migratedStory as unknown as StoryData;
}
