import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { type LegacyRecord, isRecord, recordList } from './src/domain/Story/migrations/legacyStory';

/*
 * A one-off script that rewrote exampleStory.json when onEvaluate became
 * calculateVisibility. `migrateV1_0_0_to_V1_1_0` now does the same thing for
 * every story on load, so this is kept only for re-running against the fixture
 * by hand. It reads through the same defensive helpers as the migration.
 */

const STORY_FILE = path.join(process.cwd(), 'src/data/exampleStory.json');

const upgradeLogicTree = (tree: unknown, hideBlueprintId: string): void => {
  for (const node of recordList(tree)) {
    if (node.type !== 'condition') continue;

    const children = recordList(node.children);
    let branchElse = children.find((child) => child.type === 'branch_else');

    if (!branchElse) {
      branchElse = {
        id: randomUUID(),
        type: 'branch_else',
        blueprintId: '',
        params: {},
        children: [],
      };
      node.children = [...children, branchElse];
    }

    const elseChildren = recordList(branchElse.children);
    const hasHide = elseChildren.some(
      (child) => child.type === 'action' && child.blueprintId === hideBlueprintId
    );

    if (!hasHide) {
      branchElse.children = [
        ...elseChildren,
        { id: randomUUID(), type: 'action', blueprintId: hideBlueprintId, params: {} },
      ];
    }
  }
};

const upgradeItem = (item: LegacyRecord, hideBlueprintId: string): void => {
  for (const event of recordList(item.events)) {
    if (event.name !== 'onEvaluate') continue;

    console.log(`Upgrading onEvaluate to calculateVisibility with ${hideBlueprintId}`);
    event.name = 'calculateVisibility';
    upgradeLogicTree(event.logicTree, hideBlueprintId);
  }
};

const run = (): void => {
  const parsed: unknown = JSON.parse(fs.readFileSync(STORY_FILE, 'utf-8'));
  if (!isRecord(parsed)) throw new Error(`${STORY_FILE} is not a story object.`);

  const pages = isRecord(parsed.pages) ? Object.values(parsed.pages) : [];
  for (const page of pages) {
    if (!isRecord(page)) continue;

    for (const paragraph of recordList(page.paragraphs)) {
      upgradeItem(paragraph, 'hide_paragraph');
    }
    for (const choice of recordList(page.choices)) {
      upgradeItem(choice, 'hide_choice');
    }
  }

  fs.writeFileSync(STORY_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
  console.log('Story upgraded successfully!');
};

run();
