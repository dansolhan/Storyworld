import type { Page } from '../domain/Page/Page';

export const mockStory: Page[] = [
  {
    id: "page-1",
    title: "The Awakening",
    paragraphs: [
      { id: "p1-1", text: "You wake up in a dimly lit room. The air is cold, and you can scarcely see your own hands." },
      { id: "p1-2", text: "A heavy wooden door stands to your north. To your right, a small window lets in a sliver of moonlight." }
    ],
    choices: [
      { id: "c1-1", text: "Inspect the door", targetPageId: "page-2" },
      { id: "c1-2", text: "Look out the window", targetPageId: "page-3" }
    ]
  },
  {
    id: "page-2",
    title: "The Locked Door",
    paragraphs: [
      { id: "p2-1", text: "The door is made of solid oak. You rattle the iron handle, but it doesn't budge." },
      { id: "p2-2", text: "There seems to be no keyhole. How peculiar." }
    ],
    choices: [
      { id: "c2-1", text: "Go back", targetPageId: "page-1" }
    ]
  },
  {
    id: "page-3",
    title: "A Glimpse Outside",
    paragraphs: [
      { id: "p3-1", text: "You peer through the dusty glass. Outside, an endless forest of towering pines stretches out beneath a starlit sky." },
      { id: "p3-2", text: "Suddenly, you notice a faint glow moving through the trees." }
    ],
    choices: [
      { id: "c3-1", text: "Watch the glow closely", targetPageId: "page-4" },
      { id: "c3-2", text: "Step away from the window", targetPageId: "page-1" }
    ]
  },
  {
    id: "page-4",
    title: "The Approaching Light",
    paragraphs: [
      { id: "p4-1", text: "The glow slowly grows brighter and takes the shape of a floating lantern, held by a cloaked figure." },
      { id: "p4-2", text: "The figure stops directly beneath your window, looks up, and beckons to you." }
    ],
    choices: [
      { id: "c4-1", text: "Try to open the window", targetPageId: "page-end" }
    ]
  },
  {
    id: "page-end",
    title: "To Be Continued...",
    paragraphs: [
      { id: "pend-1", text: "You tug at the iron latch. With a sudden CRACK, it gives way, and the cold night air rushes in." },
      { id: "pend-2", text: "A new adventure awaits." }
    ],
    choices: []
  }
];
