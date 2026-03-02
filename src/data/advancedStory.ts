import type { StoryData } from '../domain/Story/StoryData';

export const advancedStory: StoryData = {
  version: 3,
  title: "The Chronicles of Oakhaven",
  description: "An advanced test story demonstrating subplots, variables, conditionals, and actions.",
  startPageId: "page-main-1",
  variables: {
    playerName: "Traveler",
    gold: "10",
    hasRustyKey: "false",
    goblinDefeated: "false",
    visitedTavern: "false"
  },
  subplots: [
    {
      id: "subplot-cave",
      name: "The Goblin Cave",
      description: "A dark cavern filled with danger and loot."
    },
    {
      id: "subplot-tavern",
      name: "The Drunken Boar Tavern",
      description: "A lively place to gather rumors and rest."
    }
  ],
  pages: [
    // --- MAIN PLOT ---
    {
      id: "page-main-1",
      title: "Oakhaven Town Square",
      type: "location",
      paragraphs: [
        { id: "p-m1-1", text: "<p>Welcome to <strong>Oakhaven</strong>, <em>{{playerName}}</em>. The village square is bustling with activity.</p>" },
        { id: "p-m1-2", text: "<p>You check your coin purse. You have {{gold}} gold pieces.</p>" }
      ],
      choices: [
        { id: "c-m1-1", text: "Visit the Tavern", targetPageId: "page-main-2" },
        { id: "c-m1-2", text: "Head towards the Northern Forest", targetPageId: "page-main-3" }
      ]
    },
    {
      id: "page-main-2",
      title: "Outside The Drunken Boar",
      type: "location",
      paragraphs: [
        { id: "p-m2-1", text: "<p>You stand outside the local tavern. The sound of lute music and clinking mugs spills out into the street.</p>" }
      ],
      choices: [
        {
          id: "c-m2-1",
          text: "Enter the Tavern",
          targetPageId: "page-tav-1" // Will be overridden by action to actually enter subplot
        },
        { id: "c-m2-2", text: "Back to Town Square", targetPageId: "page-main-1" }
      ],
      actions: [
        {
          id: "act-enter-tavern",
          blueprintId: "go_to_subplot",
          params: { subplotId: "subplot-tavern", targetPageId: "page-tav-1" },
          conditionals: []
        }
      ]
    },
    {
      id: "page-main-3",
      title: "The Northern Forest Edge",
      type: "location",
      paragraphs: [
        { id: "p-m3-1", text: "<p>The trees grow thick here. A worn sign points towards a notorious Goblin Cave.</p>" },
        {
          id: "p-m3-2",
          text: "<p>You notice goblin tracks leading into the dark woods.</p>",
          conditionals: [
            { id: "cond-m3-1", blueprintId: "variable_equals", params: { variableKey: "goblinDefeated", value: "false" } }
          ]
        },
        {
          id: "p-m3-3",
          text: "<p>The forest feels safer now that the local goblin menace has been dealt with.</p>",
          conditionals: [
            { id: "cond-m3-2", blueprintId: "variable_equals", params: { variableKey: "goblinDefeated", value: "true" } }
          ]
        }
      ],
      choices: [
        {
          id: "c-m3-1",
          text: "Enter the Cave",
          targetPageId: "page-cave-1", // Will be overridden by action
          conditionals: [
            { id: "cond-m3-c", blueprintId: "variable_equals", params: { variableKey: "goblinDefeated", value: "false" } }
          ]
        },
        { id: "c-m3-2", text: "Return to Town", targetPageId: "page-main-1" }
      ],
      actions: [
        {
          id: "act-enter-cave",
          blueprintId: "go_to_subplot",
          params: { subplotId: "subplot-cave", targetPageId: "page-cave-1" },
          conditionals: [
            { id: "cond-m3-a", blueprintId: "variable_equals", params: { variableKey: "goblinDefeated", value: "false" } }
          ]
        }
      ]
    },

    // --- TAVERN SUBPLOT ---
    {
      id: "page-tav-1",
      subplotId: "subplot-tavern",
      title: "Inside the Tavern",
      type: "location",
      paragraphs: [
        { id: "p-t1-1", text: "<p>The tavern is warm and smells of roasted meat. The barkeep nods at you.</p>" }
      ],
      choices: [
        { id: "c-t1-1", text: "Buy a drink (2 gold)", targetPageId: "page-tav-2" },
        { id: "c-t1-2", text: "Talk to a hooded stranger", targetPageId: "page-tav-3" },
        { id: "c-t1-3", text: "Leave the Tavern", targetPageId: "page-main-1" } // Note: we'll use an action to go back to main
      ],
      actions: [
        {
          id: "act-leave-tav",
          blueprintId: "go_to_subplot",
          params: { subplotId: null, targetPageId: "page-main-1" },
          conditionals: []
        },
        {
          id: "act-visited-tav",
          blueprintId: "set_variable",
          params: { variableKey: "visitedTavern", value: "true" }
        }
      ]
    },
    {
      id: "page-tav-2",
      subplotId: "subplot-tavern",
      title: "Enjoying a Drink",
      type: "plot",
      paragraphs: [
        { id: "p-t2-1", text: "<p>You pay the barkeep. The ale goes down smooth and restores your spirits.</p>" }
      ],
      choices: [
        { id: "c-t2-1", text: "Finish drink and look around", targetPageId: "page-tav-1" }
      ],
      actions: [
        {
          id: "act-pay-drink",
          blueprintId: "set_variable",
          params: { variableKey: "gold", value: "8" } // Simplified, assuming started with 10
        }
      ]
    },
    {
      id: "page-tav-3",
      subplotId: "subplot-tavern",
      title: "The Hooded Stranger",
      type: "plot",
      paragraphs: [
        { id: "p-t3-1", text: "<p>The stranger leans in. 'There's treasure in the Goblin Cave up north. But you'll need this key to access the deepest vault.'</p>" },
        { id: "p-t3-2", text: "<p>He hands you a heavy, rusty key.</p>" }
      ],
      choices: [
        { id: "c-t3-1", text: "Thank him and return to the counter", targetPageId: "page-tav-1" }
      ],
      actions: [
        {
          id: "act-get-key",
          blueprintId: "set_variable",
          params: { variableKey: "hasRustyKey", value: "true" }
        }
      ]
    },

    // --- CAVE SUBPLOT ---
    {
      id: "page-cave-1",
      subplotId: "subplot-cave",
      title: "Cave Entrance",
      type: "location",
      paragraphs: [
        { id: "p-c1-1", text: "<p>It's pitch black inside. You can hear scurrying sounds in the distance.</p>" }
      ],
      choices: [
        { id: "c-c1-1", text: "Delve deeper", targetPageId: "page-cave-2" },
        { id: "c-c1-2", text: "Flee back to the forest", targetPageId: "page-main-3" }
      ],
      actions: [
        {
          id: "act-flee-cave",
          blueprintId: "go_to_subplot",
          params: { subplotId: null, targetPageId: "page-main-3" },
          conditionals: []
        }
      ]
    },
    {
      id: "page-cave-2",
      subplotId: "subplot-cave",
      title: "Goblin Ambush!",
      type: "plot",
      paragraphs: [
        { id: "p-c2-1", text: "<p>A feral goblin jumps out from the shadows swinging a spiked club!</p>" }
      ],
      choices: [
        { id: "c-c2-1", text: "Fight the goblin", targetPageId: "page-cave-3" }
      ]
    },
    {
      id: "page-cave-3",
      subplotId: "subplot-cave",
      title: "Victory",
      type: "plot",
      paragraphs: [
        { id: "p-c3-1", text: "<p>You defeat the goblin with a swift strike. Behind it is a large iron door.</p>" },
        {
          id: "p-c3-2",
          text: "<p>The door is locked... but wait! The rusty key the stranger gave you fits perfectly!</p>",
          conditionals: [
            { id: "cond-c3-key", blueprintId: "variable_equals", params: { variableKey: "hasRustyKey", value: "true" } }
          ]
        },
        {
          id: "p-c3-3",
          text: "<p>The door is locked tightly. You have no way to open it. You must turn back.</p>",
          conditionals: [
            { id: "cond-c3-nokey", blueprintId: "variable_equals", params: { variableKey: "hasRustyKey", value: "false" } }
          ]
        }
      ],
      choices: [
        {
          id: "c-c3-1",
          text: "Open the vault",
          targetPageId: "page-cave-4",
          conditionals: [
            { id: "cond-c3c-key", blueprintId: "variable_equals", params: { variableKey: "hasRustyKey", value: "true" } }
          ]
        },
        { id: "c-c3-2", text: "Leave the cave", targetPageId: "page-main-3" }
      ],
      actions: [
        {
          id: "act-leave-cave-victory",
          blueprintId: "go_to_subplot",
          params: { subplotId: null, targetPageId: "page-main-3" },
          conditionals: []
        },
        {
          id: "act-goblin-slain",
          blueprintId: "set_variable",
          params: { variableKey: "goblinDefeated", value: "true" }
        }
      ]
    },
    {
      id: "page-cave-4",
      subplotId: "subplot-cave",
      title: "The Treasure Vault",
      type: "location",
      paragraphs: [
        { id: "p-c4-1", text: "<p>The room glitters with gold coins! You stuff your pockets full.</p>" }
      ],
      choices: [
        { id: "c-c4-1", text: "Return to the village in triumph", targetPageId: "page-main-1" }
      ],
      actions: [
        {
          id: "act-return-triumph",
          blueprintId: "go_to_subplot",
          params: { subplotId: null, targetPageId: "page-main-1" }
        },
        {
          id: "act-get-gold",
          blueprintId: "set_variable",
          params: { variableKey: "gold", value: "100" }
        }
      ]
    }
  ],
  uiMetadata: {
    nodePositions: {
      "page-main-1": { x: 100, y: 100 },
      "page-main-2": { x: 400, y: -50 },
      "page-main-3": { x: 400, y: 250 },
      "page-tav-1": { x: 100, y: 100 },
      "page-tav-2": { x: 400, y: -50 },
      "page-tav-3": { x: 400, y: 250 },
      "page-cave-1": { x: 100, y: 100 },
      "page-cave-2": { x: 400, y: 100 },
      "page-cave-3": { x: 700, y: 100 },
      "page-cave-4": { x: 1000, y: 100 }
    }
  }
};
