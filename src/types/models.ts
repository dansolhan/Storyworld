export interface Paragraph {
  id: string;
  text: string;
}

export interface Choice {
  id: string;
  text: string;
  targetPageId: string;
}

export interface Page {
  id: string;
  title: string;
  paragraphs: Paragraph[];
  choices: Choice[];
}
