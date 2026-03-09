import type { StoryData } from '../domain/Story/StoryData';

/**
 * Example story for development and testing.
 * Version 4 showcases all new features:
 *  - Action triggers (on_enter / on_exit)
 *  - Action-only choices (no targetPageId, only actions)
 *  - Post Message action
 *  - go_to_subplot on choices (not on pages)
 */
export const exampleStory: StoryData = {
  version: 4,
  title: "The Awakening",
  description: "A short demo story showcasing subplots, action triggers, and action-only choices.",
  startPageId: "page-1",
  variables: {
    playerName: { type: "string", value: "Arthur" },
    heroClass: { type: "string", value: "Knight" },
    weapon: { type: "string", value: "Rusty Longsword" },
    hasGoldenKey: { type: "boolean", value: false },
    hasFoundTome: { type: "boolean", value: false },
  },
  audio: {
    "audio-mystery": {
      id: "audio-mystery",
      title: "Mystery",
      description: "A mysterious background track",
      src: "/example_music/Mystery.mp3",
      type: "music"
    },
    "audio-spooky": {
      id: "audio-spooky",
      title: "Spooky Stories",
      description: "A spooky background track",
      src: "/example_music/SpookyStories.mp3",
      type: "music"
    },
    "audio-house": {
      id: "audio-house",
      title: "Mystery Museum",
      description: "A tense atmospheric track for the house",
      src: "/example_music/MysteryMuseum.mp3",
      type: "music"
    }
  },
  atmospheres: {
    "atmo-main": {
      id: "atmo-main",
      title: "Main Room Vibes",
      music: "audio-mystery"
    },
    "atmo-cellar": {
      id: "atmo-cellar",
      title: "Spooky Cellar Vibes",
      music: "audio-spooky"
    },
    "atmo-house": {
      id: "atmo-house",
      title: "House Interior",
      music: "audio-house"
    }
  },
  uiMetadata: {
    nodePositions: {
      "page-1": { x: 100, y: 100 },
      "page-2": { x: 100, y: -200 },
      "page-3": { x: 500, y: 100 },
      "page-4": { x: 900, y: 100 },
      "page-5": { x: 100, y: 400 },
      "page-6": { x: 500, y: 400 },
      "page-end": { x: 900, y: 400 },
      "page-cellar-1": { x: 300, y: 800 },
      "page-cellar-2": { x: 700, y: 800 },
      "page-woods-1": { x: 1300, y: 100 },
      "page-woods-2": { x: 1700, y: 100 }
    }
  },
  subplots: [
    {
      id: "subplot-cellar",
      name: "The Hidden Cellar",
      description: "A dark forgotten place below the room."
    }
  ],
  pages: [

    // ─────────────────────────────────────────────────────────────────────────
    // MAIN PLOT
    // ─────────────────────────────────────────────────────────────────────────

    {
      id: "page-1",
      title: "The Awakening",
      atmosphereId: "atmo-house",
      paragraphs: [
        { id: "p1-1", text: "<p>You wake up in a <strong>dimly lit room</strong>. The air is cold, and you can scarcely see your own hands, <em>{{playerName}}</em>.</p>" },
        { id: "p1-2", text: "<p>A heavy wooden door stands to your north. To your right, a <span class=\"contextual-text-mark\" data-context=\"The window is covered in soot and barely lets any light in. At the bottom right corner, there is a small crack.\">small window</span> lets in a sliver of moonlight.</p>" },
        { id: "p1-3", text: "<p>You try to remember how you got here, but your mind is a blank slate. The only thing you are certain of is your training as a <strong>{{heroClass}}</strong>.</p>" }
      ],
      choices: [
        { id: "c1-1", text: "Inspect the door", targetPageId: "page-2" },
        { id: "c1-2", text: "Look out the window", targetPageId: "page-3" },
        { id: "c1-3", text: "Search your pockets", targetPageId: "page-5" },
        // Action-only choice: no targetPageId, just actions
        {
          id: "c1-pray",
          text: "Kneel and pray for guidance",
          actions: [
            {
              id: "act-pray-msg",
              blueprintId: "post_message",
              trigger: "on_enter",
              params: { message: "A faint warmth washes over you. Perhaps the gods are listening." }
            },
            {
              id: "act-pray-var",
              blueprintId: "set_variable",
              trigger: "on_enter",
              params: { variableKey: "heroClass", value: "Blessed Knight" }
            }
          ]
        },
        // Subplot entry via choice action
        {
          id: "c1-4",
          text: "Lift the loose floorboard",
          actions: [
            {
              id: "act-go-cellar-choice",
              blueprintId: "go_to_subplot",
              trigger: "on_enter",
              params: { subplotId: "subplot-cellar", targetPageId: "page-cellar-1" }
            }
          ]
        }
      ],
      // on_exit action: fires when the player leaves this page
      actions: [
        {
          id: "act-leave-awakening",
          blueprintId: "set_variable",
          trigger: "on_exit",
          params: { variableKey: "hasVisitedStart", value: "true" }
        }
      ]
    },

    {
      id: "page-2",
      title: "The Locked Door",
      atmosphereId: "atmo-house",
      paragraphs: [
        { id: "p2-1", text: "<p>The door is made of solid oak, reinforced with <span class=\"contextual-text-mark\" data-context=\"The iron bands are rusted, but thick. Forcing the door open without a tool seems impossible.\">iron bands</span>. You rattle the iron handle, but it doesn't budge.</p>" },
        { id: "p2-2", text: "<p>There seems to be no keyhole. How peculiar.</p>" }
      ],
      choices: [
        { id: "c2-1", text: "Go back to the center of the room", targetPageId: "page-1" }
      ]
    },

    {
      id: "page-3",
      title: "A Glimpse Outside",
      atmosphereId: "atmo-house",
      paragraphs: [
        { id: "p3-1", text: "<p>You peer through the dusty glass. Outside, an endless forest of towering pines stretches out beneath a starlit sky.</p>" },
        { id: "p3-2", text: "<p>Suddenly, you notice a faint glow moving through the trees. It looks like... a <span class=\"contextual-text-mark\" data-context=\"A spherical object emitting a warm, pulsating orange light. It bobs up and down rhythmically.\">floating lantern</span>.</p>" }
      ],
      choices: [
        { id: "c3-1", text: "Watch the glow closely", targetPageId: "page-4" },
        { id: "c3-2", text: "Step away from the window", targetPageId: "page-1" },
        // Action-only: post a flavour message, no navigation
        {
          id: "c3-signal",
          text: "Wave at the floating light",
          actions: [
            {
              id: "act-wave-msg",
              blueprintId: "post_message",
              trigger: "on_enter",
              params: { message: "The light pulses twice — as if acknowledging you." }
            }
          ]
        }
      ]
    },

    {
      id: "page-4",
      title: "The Approaching Light",
      atmosphereId: "atmo-house",
      paragraphs: [
        { id: "p4-1", text: "<p>The glow slowly grows brighter and takes the shape of the lantern, held by a <span class=\"contextual-text-mark\" data-context=\"The figure is shrouded in a dark, worn cloak. You cannot see their face, only a pair of glowing yellow eyes from beneath the hood.\">cloaked figure</span>.</p>" },
        { id: "p4-2", text: "<p>The figure stops directly beneath your window, looks up, and beckons to you. They point towards a hidden lever beside your window.</p>" }
      ],
      choices: [
        { id: "c4-1", text: "Pull the hidden lever", targetPageId: "page-end" },
        { id: "c4-2", text: "Ignore the figure and turn back", targetPageId: "page-1" }
      ]
    },

    {
      id: "page-5",
      title: "Checking Pockets",
      atmosphereId: "atmo-main",
      paragraphs: [
        { id: "p5-1", text: "<p>You pat down your clothes. You are wearing a simple tunic, but you feel the weight of your trusty <strong>{{weapon}}</strong> hanging at your side.</p>" },
        { id: "p5-2", text: "<p>Deep in your left pocket, your hand brushes against something cold and geometric. A <span class=\"contextual-text-mark\" data-context=\"The key has no teeth, just a complex series of grooves carved into strange, iridescent metal.\">strange golden key</span>.</p>" }
      ],
      choices: [
        { id: "c5-1", text: "Take the key to the door", targetPageId: "page-6" },
        { id: "c5-2", text: "Keep looking around", targetPageId: "page-1" }
      ],
      // on_enter: immediately mark the key as found + inject a message
      actions: [
        {
          id: "act-find-key",
          blueprintId: "set_variable",
          trigger: "on_enter",
          params: { variableKey: "hasGoldenKey", value: "true" }
        },
        {
          id: "act-find-key-msg",
          blueprintId: "post_message",
          trigger: "on_enter",
          params: { message: "You now carry the strange golden key." }
        }
      ]
    },

    {
      id: "page-6",
      title: "The Hidden Lock",
      atmosphereId: "atmo-main",
      paragraphs: [
        { id: "p6-1", text: "<p>Holding the strange golden key, you approach the oak door again. Though there's no visible keyhole, bringing the key close causes a <span class=\"contextual-text-mark\" data-context=\"A shimmering projection of light forms a complex lock mechanism mid-air.\">holographic lock</span> to materialize on the wood.</p>" },
        { id: "p6-2", text: "<p>You insert the key. The door groans and swings open heavily, revealing a dark stone corridor ahead.</p>" }
      ],
      choices: [
        { id: "c6-1", text: "Step into the corridor", targetPageId: "page-end" }
      ]
    },

    {
      id: "page-end",
      title: "To Be Continued...",
      atmosphereId: "atmo-main",
      paragraphs: [
        { id: "pend-1", text: "<p>You take your first steps out of the room. The air changes instantly, carrying the scent of damp earth and old magic.</p>" },
        { id: "pend-2", text: "<p>A new adventure awaits you, <em>{{playerName}}</em>.</p>" }
      ],
      choices: [
        { id: "cend-1", text: "Walk into the forest", targetPageId: "page-woods-1" }
      ]
    },

    // ─────────────────────────────────────────────────────────────────────────
    // SUBPLOT: The Hidden Cellar
    // ─────────────────────────────────────────────────────────────────────────

    {
      id: "page-cellar-1",
      subplotId: "subplot-cellar",
      title: "The Dusty Cellar",
      atmosphereId: "atmo-cellar",
      paragraphs: [
        { id: "p-cell1-1", text: "<p>You descend a rickety wooden ladder into the darkness. The air smells of mold and old wine.</p>" },
        { id: "p-cell1-2", text: "<p>In the corner, you see a small chest glimmering faintly in the dark.</p>" }
      ],
      choices: [
        // Action-only: exit subplot via choice
        {
          id: "c-cell1-back",
          text: "Climb back up",
          actions: [
            {
              id: "act-leave-cellar",
              blueprintId: "go_to_subplot",
              trigger: "on_enter",
              params: { subplotId: null, targetPageId: "page-1" }
            }
          ]
        },
        { id: "c-cell1-2", text: "Open the chest", targetPageId: "page-cellar-2" }
      ]
    },

    {
      id: "page-cellar-2",
      subplotId: "subplot-cellar",
      title: "The Cellar Treasure",
      atmosphereId: "atmo-cellar",
      paragraphs: [
        { id: "p-cell2-1", text: "<p>The chest is unlocked! Inside, you find a handful of gold coins and an old, dusty tome.</p>" }
      ],
      choices: [
        // Action-only: take the tome
        {
          id: "c-cell2-take",
          text: "Take the tome",
          actions: [
            {
              id: "act-take-tome",
              blueprintId: "set_variable",
              trigger: "on_enter",
              params: { variableKey: "hasFoundTome", value: true }
            },
            {
              id: "act-take-tome-msg",
              blueprintId: "post_message",
              trigger: "on_enter",
              params: { message: "You carefully slip the dusty tome into your pack. The writing inside is in an unknown script." }
            }
          ]
        },
        // Action-only: exit subplot via choice
        {
          id: "c-cell2-back",
          text: "Return to the room above",
          actions: [
            {
              id: "act-leave-cellar-2",
              blueprintId: "go_to_subplot",
              trigger: "on_enter",
              params: { subplotId: null, targetPageId: "page-1" }
            }
          ]
        }
      ]
    },

    // ─────────────────────────────────────────────────────────────────────────
    // NEW WOODS EXPANSION (demonstrating adding more pages with same atmosphere)
    // ─────────────────────────────────────────────────────────────────────────
    {
      id: "page-woods-1",
      title: "Deep into the Woods",
      atmosphereId: "atmo-main",
      paragraphs: [
        { id: "pw-1", text: "<p>You finally step past the heavy doors and outside into the cold, starlit night. The forest is vast, and the <span class=\"contextual-text-mark\" data-context=\"The trees are so tall they blot out the sky in some places.\">grand pines</span> loom menacingly over you.</p>" }
      ],
      choices: [
        { id: "cw-1", text: "Follow the mysterious glow", targetPageId: "page-woods-2" }
      ]
    },

    {
      id: "page-woods-2",
      title: "The Forgotten Shrine",
      atmosphereId: "atmo-main",
      paragraphs: [
        { id: "pw2-1", text: "<p>Following the faint orange light, you arrive at an ancient stone shrine heavily covered by moss. The figure is nowhere to be seen.</p>" }
      ],
      choices: []
    }

  ]
};
