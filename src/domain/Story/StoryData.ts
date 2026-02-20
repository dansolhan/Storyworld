import type { Page } from '../Page/Page';

export interface StoryData {
  pages: Page[];
  variables: Record<string, string>;
}
