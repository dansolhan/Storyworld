import fs from 'fs';
import path from 'path';

const STORY_FILE = path.join(process.cwd(), 'src/data/exampleStory.json');

const run = () => {
  const data = JSON.parse(fs.readFileSync(STORY_FILE, 'utf-8'));
  
  for (const pageId in data.pages) {
    const page = data.pages[pageId];
    
    if (page.choices) {
      for (const c of page.choices) {
        if (!c.events) continue;
        for (const e of c.events) {
          if (e.name === 'onEnter') {
            console.log(`Renaming choice event from onEnter to onSelect on choice ${c.id}`);
            e.name = 'onSelect';
          }
        }
      }
    }
  }
  
  fs.writeFileSync(STORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Story upgrade from onEnter to onSelect done!');
};

run();
