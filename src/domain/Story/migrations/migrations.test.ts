import { describe, it, expect } from 'vitest';
import { migrateStory, CURRENT_VERSION } from './migrations';

/** The migrated shapes are legacy JSON, so tests read them structurally. */
type Loose = Record<string, unknown>;
const asRecord = (value: unknown): Loose => value as Loose;
const asList = (value: unknown): Loose[] => value as Loose[];
const firstPage = (story: unknown): Loose => asList(asRecord(story).pages)[0];

describe('Story Migrations', () => {
  it('should attach the current version to an unversioned story', () => {
    const oldStory = {
      title: 'Old Story',
      pages: [],
      variables: {},
    };

    const migrated = migrateStory(oldStory);
    expect(migrated.version).toBe(CURRENT_VERSION);
    expect(migrated.title).toBe('Old Story');
  });

  it('should add an empty subplots array when migrating from V2 to V3', () => {
    const v2Story = {
      version: 2,
      title: 'V2 Story',
      pages: [],
      variables: {},
      uiMetadata: {}
    };

    const migrated = migrateStory(v2Story);
    // Migration now runs through v3, lands at CURRENT_VERSION (7)
    expect(migrated.version).toBe(CURRENT_VERSION);
    expect(migrated.subplots).toEqual([]);
    expect(migrated.audio).toEqual({});
    expect(migrated.atmospheres).toEqual({});
    expect(migrated.items).toEqual({});
  });

  // Adding a mock or ensuring that undefined/null throws properly
  it('should throw when no story structure is passed', () => {
    expect(() => migrateStory(null)).toThrow('Cannot migrate undefined or null story structure.');
  });

  it('throws for a value that is not a story object', () => {
    expect(() => migrateStory('a string')).toThrow('Cannot migrate undefined or null story structure.');
    expect(() => migrateStory(7)).toThrow('Cannot migrate undefined or null story structure.');
    expect(() => migrateStory([])).toThrow('Cannot migrate undefined or null story structure.');
  });

  it('throws when the version has no migration path', () => {
    expect(() => migrateStory({ version: '99.0.0', pages: [] })).toThrow(
      /Missing migration script to step from version 99\.0\.0/
    );
  });

  describe('0.9.0 → 1.0.0: actions and conditionals become events', () => {
    const legacyStory = {
      version: '0.9.0',
      title: 'Legacy',
      pages: [
        {
          id: 'page-1',
          title: 'Start',
          conditionals: [{ id: 'cond-1', blueprintId: 'has_item', params: { itemId: 'key' } }],
          actions: [{ id: 'act-1', blueprintId: 'set_variable', params: { var: 'seen' } }],
          paragraphs: [],
          choices: [
            {
              id: 'choice-1',
              text: 'Onward',
              actions: [{ id: 'act-2', blueprintId: 'post_message', params: {} }],
            },
          ],
        },
      ],
    };

    it('drops the legacy fields and builds one event per kind', () => {
      const page = firstPage(migrateStory(legacyStory));

      expect(page.actions).toBeUndefined();
      expect(page.conditionals).toBeUndefined();

      const events = asList(page.events);
      expect(events).toHaveLength(2);
      // Conditionals become the visibility event, actions the arrival event.
      expect(events.map((event) => event.name)).toEqual(['calculateVisibility', 'onEnter']);
    });

    it('turns a conditional into a condition node with then/else branches', () => {
      const page = firstPage(migrateStory(legacyStory));
      const visibility = asList(page.events)[0];
      const [condition] = asList(visibility.logicTree);

      expect(condition.type).toBe('condition');
      expect(condition.blueprintId).toBe('has_item');
      expect(condition.params).toEqual({ itemId: 'key' });
      expect(asList(condition.children).map((child) => child.type)).toEqual([
        'branch_then',
        'branch_else',
      ]);
    });

    it('renames a choice event to onSelect, but leaves the page event alone', () => {
      const page = firstPage(migrateStory(legacyStory));
      const choice = asList(page.choices)[0];

      expect(asList(choice.events).map((event) => event.name)).toEqual(['onSelect']);
      // The page keeps onEnter — only choices were renamed.
      expect(asList(page.events).map((event) => event.name)).toContain('onEnter');
    });

    it('gives a group conditional its own conditions branch', () => {
      const grouped = {
        version: '0.9.0',
        pages: [
          {
            id: 'page-1',
            paragraphs: [],
            choices: [],
            conditionals: [
              {
                id: 'grp',
                blueprintId: 'and_group',
                children: [{ id: 'inner', blueprintId: 'has_item', params: {} }],
              },
            ],
          },
        ],
      };

      const page = firstPage(migrateStory(grouped));
      const [group] = asList(asList(page.events)[0].logicTree);
      const branches = asList(group.children);

      expect(branches.map((branch) => branch.type)).toEqual([
        'branch_conditions',
        'branch_then',
        'branch_else',
      ]);
      expect(asList(branches[0].children)[0].blueprintId).toBe('has_item');
    });
  });

  describe('1.0.0 → 1.1.0: event renames and hide injection', () => {
    const storyWithVisibility = (domain: 'paragraphs' | 'choices') => ({
      version: '1.0.0',
      pages: [
        {
          id: 'page-1',
          paragraphs: domain === 'paragraphs' ? [{ id: 'para-1', text: 'Hi', events: visibilityEvent() }] : [],
          choices: domain === 'choices' ? [{ id: 'choice-1', text: 'Go', events: visibilityEvent() }] : [],
        },
      ],
    });

    const visibilityEvent = () => [
      {
        id: 'evt-1',
        name: 'onEvaluate',
        logicTree: [
          {
            id: 'cond-1',
            type: 'condition',
            blueprintId: 'has_item',
            children: [{ id: 'then-1', type: 'branch_then', children: [] }],
          },
        ],
      },
    ];

    it('renames onEvaluate to calculateVisibility', () => {
      const page = firstPage(migrateStory(storyWithVisibility('paragraphs')));
      const paragraph = asList(page.paragraphs)[0];
      expect(asList(paragraph.events)[0].name).toBe('calculateVisibility');
    });

    it('adds a missing else branch carrying the matching hide action', () => {
      const page = firstPage(migrateStory(storyWithVisibility('paragraphs')));
      const paragraph = asList(page.paragraphs)[0];
      const [condition] = asList(asList(paragraph.events)[0].logicTree);

      const branchElse = asList(condition.children).find((child) => child.type === 'branch_else');
      expect(branchElse).toBeDefined();
      const hide = asList(branchElse!.children)[0];
      expect(hide.blueprintId).toBe('hide_paragraph');
      expect(hide.type).toBe('action');
    });

    it('hides the choice rather than the paragraph when the owner is a choice', () => {
      const page = firstPage(migrateStory(storyWithVisibility('choices')));
      const choice = asList(page.choices)[0];
      const [condition] = asList(asList(choice.events)[0].logicTree);

      const branchElse = asList(condition.children).find((child) => child.type === 'branch_else')!;
      expect(asList(branchElse.children)[0].blueprintId).toBe('hide_choice');
    });

    it('does not add a second hide action when one is already there', () => {
      const already = {
        version: '1.0.0',
        pages: [
          {
            id: 'page-1',
            choices: [],
            paragraphs: [
              {
                id: 'para-1',
                events: [
                  {
                    id: 'evt-1',
                    name: 'calculateVisibility',
                    logicTree: [
                      {
                        id: 'cond-1',
                        type: 'condition',
                        children: [
                          {
                            id: 'else-1',
                            type: 'branch_else',
                            children: [{ id: 'a', type: 'action', blueprintId: 'hide_paragraph' }],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const page = firstPage(migrateStory(already));
      const [condition] = asList(asList(asList(page.paragraphs)[0].events)[0].logicTree);
      const branchElse = asList(condition.children).find((child) => child.type === 'branch_else')!;
      expect(asList(branchElse.children)).toHaveLength(1);
    });
  });

  describe('tolerating malformed saves', () => {
    it('accepts pages stored as an object keyed by id', () => {
      const keyed = {
        version: '0.9.0',
        pages: {
          'page-1': { id: 'page-1', title: 'One', paragraphs: [], choices: [] },
          'page-2': { id: 'page-2', title: 'Two', paragraphs: [], choices: [] },
        },
      };

      const migrated = migrateStory(keyed);
      expect(migrated.pages).toHaveLength(2);
      expect(migrated.pages.map((page) => page.title)).toEqual(['One', 'Two']);
    });

    it('normalises page collections that hold the wrong type instead of throwing', () => {
      const broken = {
        version: '0.9.0',
        pages: [{ id: 'page-1', paragraphs: 'not a list', choices: null, conditionals: 'nope' }],
      };

      const page = firstPage(migrateStory(broken));

      expect(page.paragraphs).toEqual([]);
      expect(page.choices).toEqual([]);
      // 'nope' is not a list of conditionals, so no event is invented for it.
      expect(page.events).toBeUndefined();
    });

    it('normalises a malformed variables map when the chain still passes through V4', () => {
      const migrated = migrateStory({ version: 4, pages: [], variables: 'not an object' });
      expect(migrated.variables).toEqual({});
    });

    it('normalises malformed subplots when the chain still passes through V2', () => {
      const migrated = migrateStory({ version: 2, pages: [], subplots: 'not a list' });
      expect(migrated.subplots).toEqual([]);
    });

    it('leaves root fields untouched when the chain starts past their migration', () => {
      // A 0.9.0 save has already been through the numeric steps, so the
      // variable and subplot migrations do not run again.
      const migrated = migrateStory({ version: '0.9.0', pages: [], variables: 'passed through' });
      expect(asRecord(migrated).variables).toBe('passed through');
    });

    it('drops non-object entries from a page list', () => {
      const mixed = { version: '0.9.0', pages: [{ id: 'page-1', paragraphs: [], choices: [] }, null, 'junk'] };
      expect(migrateStory(mixed).pages).toHaveLength(1);
    });
  });

  describe('variable migrations', () => {
    it('wraps bare string variables in a typed shape and gives them tags', () => {
      const migrated = migrateStory({ version: 4, pages: [], variables: { name: 'Ada' } });
      expect(migrated.variables.name).toEqual({ type: 'string', value: 'Ada', tags: [] });
    });

    it('leaves already-typed variables alone apart from adding tags', () => {
      const migrated = migrateStory({
        version: 4,
        pages: [],
        variables: { gold: { type: 'number', value: 10 } },
      });
      expect(migrated.variables.gold).toEqual({ type: 'number', value: 10, tags: [] });
    });
  });

  it('normalises an empty choice target to undefined', () => {
    const migrated = migrateStory({
      version: 3,
      pages: [{ id: 'page-1', paragraphs: [], choices: [{ id: 'c1', text: 'Go', targetPageId: '' }] }],
    });
    expect(migrated.pages[0].choices[0].targetPageId).toBeUndefined();
  });

  describe('1.1.0 → 1.2.0: status conditions become a logic tree', () => {
    const storyWithStatus = (statusData: unknown) => ({
      version: '1.1.0',
      pages: [{ id: 'page-1', paragraphs: [], choices: [] }],
      statusData,
    });

    const statusEntries = (story: ReturnType<typeof migrateStory>): Record<string, unknown>[] =>
      (story.statusData ?? []) as unknown as Record<string, unknown>[];

    it('converts a conditional into a condition node the evaluator can read', () => {
      const migrated = migrateStory(
        storyWithStatus([
          {
            id: 'sd-1',
            title: 'Curse',
            conditionals: [{ id: 'cond-1', blueprintId: 'has_item', params: { itemId: 'amulet' } }],
          },
        ])
      );

      const [entry] = statusEntries(migrated);
      expect(entry.condition).toEqual([
        {
          id: 'cond-1',
          // The field a `Conditional` never had, and the reason it evaluated to nothing.
          type: 'condition',
          name: 'has_item',
          blueprintId: 'has_item',
          params: { itemId: 'amulet' },
        },
      ]);
    });

    it('drops the old field rather than leaving two representations', () => {
      const migrated = migrateStory(
        storyWithStatus([
          { id: 'sd-1', title: 'Curse', conditionals: [{ id: 'c1', blueprintId: 'has_item' }] },
        ])
      );

      expect(statusEntries(migrated)[0]).not.toHaveProperty('conditionals');
    });

    it('gives a nested group its branch_conditions, where a group reads its operands', () => {
      const migrated = migrateStory(
        storyWithStatus([
          {
            id: 'sd-1',
            title: 'Curse',
            conditionals: [
              {
                id: 'group-1',
                blueprintId: 'and_group',
                children: [
                  { id: 'c1', blueprintId: 'has_item', params: { itemId: 'amulet' } },
                  { id: 'c2', blueprintId: 'first_visit', params: { not: false } },
                ],
              },
            ],
          },
        ])
      );

      const [root] = statusEntries(migrated)[0].condition as Record<string, unknown>[];
      const children = root.children as Record<string, unknown>[];

      expect(children).toHaveLength(1);
      expect(children[0].type).toBe('branch_conditions');
      expect((children[0].children as unknown[]).map((child) => (child as Record<string, unknown>).id)).toEqual([
        'c1',
        'c2',
      ]);
    });

    it('leaves an entry with no conditions alone rather than giving it an empty one', () => {
      const migrated = migrateStory(storyWithStatus([{ id: 'sd-1', title: 'HP', value: '{{hp}}' }]));

      expect(statusEntries(migrated)[0]).not.toHaveProperty('condition');
      expect(statusEntries(migrated)[0].title).toBe('HP');
    });

    it('keeps the rest of the entry', () => {
      const migrated = migrateStory(
        storyWithStatus([
          {
            id: 'sd-1',
            title: 'Gold',
            value: '{{gold}}',
            priority: 90,
            color: '#c9a84c',
            conditionals: [{ id: 'c1', blueprintId: 'has_item' }],
          },
        ])
      );

      expect(statusEntries(migrated)[0]).toMatchObject({
        id: 'sd-1',
        title: 'Gold',
        value: '{{gold}}',
        priority: 90,
        color: '#c9a84c',
      });
    });

    it('tolerates a save whose statusData is not a list', () => {
      expect(statusEntries(migrateStory(storyWithStatus('nonsense')))).toEqual([]);
      expect(statusEntries(migrateStory(storyWithStatus(undefined)))).toEqual([]);
    });

    it('carries a 1.0.0 story all the way through both hops', () => {
      const migrated = migrateStory({
        version: '1.0.0',
        pages: [{ id: 'page-1', paragraphs: [], choices: [] }],
        statusData: [{ id: 'sd-1', title: 'Curse', conditionals: [{ id: 'c1', blueprintId: 'has_item' }] }],
      });

      expect(migrated.version).toBe(CURRENT_VERSION);
      expect(statusEntries(migrated)[0].condition).toHaveLength(1);
    });
  });
});
