import type { Page } from '../Page/Page';

export interface StoryData {
  version: number;
  title?: string;
  description?: string;
  startPageId?: string;
  pages: Page[];
  variables: Record<string, string>;
}
