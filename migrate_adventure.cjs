const fs = require('fs');
const path = require('path');

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const filePath = path.join(process.cwd(), 'test_adventure.json');
console.log('Reading from:', filePath);

if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
}

let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// 1. Story Metadata
if (!data.titleLocId) data.titleLocId = generateUUID();
if (!data.descriptionLocId) data.descriptionLocId = generateUUID();

// 2. Pages
if (data.pages) {
  data.pages.forEach(page => {
    if (!page.titleLocId) page.titleLocId = generateUUID();
    
    // Paragraphs
    if (page.paragraphs) {
      page.paragraphs.forEach(p => {
        if (!p.textLocId) p.textLocId = generateUUID();
        
        // Handle events if they exist
        if (p.events) {
          p.events.forEach(e => {
            if (e.logicTree) {
              processLogicTree(e.logicTree);
            }
          });
        }
      });
    }
    
    // Choices
    if (page.choices) {
      page.choices.forEach(c => {
        if (!c.textLocId) c.textLocId = generateUUID();
        
        // Handle events if they exist
        if (c.events) {
          c.events.forEach(e => {
            if (e.logicTree) {
              processLogicTree(e.logicTree);
            }
          });
        }
      });
    }

    // Handle Page events
    if (page.events) {
      page.events.forEach(e => {
        if (e.logicTree) {
          processLogicTree(e.logicTree);
        }
      });
    }
  });
}

// 3. Items
if (data.items) {
  Object.values(data.items).forEach(item => {
    if (!item.nameLocId) item.nameLocId = generateUUID();
    if (!item.descriptionLocId) item.descriptionLocId = generateUUID();
    if (item.contextChoices) {
      item.contextChoices.forEach(cc => {
        if (!cc.textLocId) cc.textLocId = generateUUID();
      });
    }
  });
}

// 4. StatusData
if (data.statusData) {
  data.statusData.forEach(sd => {
    if (!sd.titleLocId) sd.titleLocId = generateUUID();
    if (!sd.valueLocId) sd.valueLocId = generateUUID();
  });
}

function processLogicTree(nodes) {
  if (!nodes) return;
  nodes.forEach(node => {
    if (node.blueprintId === 'post_message' && node.params) {
      if (!node.params.messageLocId) {
        node.params.messageLocId = generateUUID();
      }
    }
    if (node.children) {
      processLogicTree(node.children);
    }
  });
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated test_adventure.json with localization IDs.');
