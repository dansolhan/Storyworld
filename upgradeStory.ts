import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const STORY_FILE = path.join(process.cwd(), 'src/data/exampleStory.json');

const upgradeLogicTree = (tree: any[], hideBlueprintId: string) => {
  for (const node of tree) {
    if (node.type === 'condition') {
      let branchElse = node.children?.find((c: any) => c.type === 'branch_else');
      
      // Ensure branch_else exists
      if (!branchElse) {
        branchElse = {
          id: randomUUID(),
          type: 'branch_else',
          blueprintId: '',
          params: {},
          children: []
        };
        if (!node.children) node.children = [];
        node.children.push(branchElse);
      }
      
      // Ensure children array exists
      if (!branchElse.children) branchElse.children = [];
      
      // Add hide action if not already present
      const hasHide = branchElse.children.some((c: any) => c.type === 'action' && c.blueprintId === hideBlueprintId);
      if (!hasHide) {
        branchElse.children.push({
          id: randomUUID(),
          type: 'action',
          blueprintId: hideBlueprintId,
          params: {}
        });
      }
    }
  }
};

const upgradeItem = (item: any, hideBlueprintId: string) => {
  if (!item.events) return;
  
  for (const event of item.events) {
    if (event.name === 'onEvaluate') {
      console.log(`Upgrading onEvaluate to calculateVisibility with ${hideBlueprintId}`);
      event.name = 'calculateVisibility';
      
      if (event.logicTree) {
        upgradeLogicTree(event.logicTree, hideBlueprintId);
      }
    }
  }
};

const run = () => {
  const data = JSON.parse(fs.readFileSync(STORY_FILE, 'utf-8'));
  
  for (const pageId in data.pages) {
    const page = data.pages[pageId];
    
    if (page.paragraphs) {
      for (const p of page.paragraphs) {
        upgradeItem(p, 'hide_paragraph');
      }
    }
    
    if (page.choices) {
      for (const c of page.choices) {
        upgradeItem(c, 'hide_choice');
      }
    }
  }
  
  fs.writeFileSync(STORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Story upgraded successfully!');
};

run();
