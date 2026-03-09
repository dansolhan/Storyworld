import type { StoryData } from '../domain/Story/StoryData';

/**
 * Triggers a browser download of a generated file
 */
const downloadFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);

  // Required for Firefox
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  URL.revokeObjectURL(url);
};

/**
 * Exports the story directly to a highly readable JSON file.
 * Perfect for version control and the author debugging.
 */
export const exportToJson = (data: StoryData, filename = 'game_data.json') => {
  const jsonString = JSON.stringify(data, null, 2);
  downloadFile(filename, jsonString, 'application/json');
};

/**
 * Exports the story to a Base64 encoded format obfuscated with a custom extension.
 * Helps prevent casual players from reading/spoiling the story easily.
 */
export const exportToStoryworld = (data: StoryData, filename = 'game_data.storyworld') => {
  // We strip away uiMetadata (editor positions) inside the player game bundle
  const gameData = { ...data };
  delete (gameData as any).uiMetadata;
  const jsonString = JSON.stringify(gameData);
  // btoa encodes to Base64
  const base64String = btoa(unescape(encodeURIComponent(jsonString)));
  downloadFile(filename, base64String, 'application/octet-stream');
};

/**
 * Future utility for the Player: Reads an obfuscated Base64 string back into JSON.
 */
export const parseFromStoryworld = (base64String: string): StoryData => {
  try {
    const jsonString = decodeURIComponent(escape(atob(base64String)));
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse .storyworld file", error);
    return { version: 1, pages: [], variables: {} };
  }
};
