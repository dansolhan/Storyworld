import { useRef } from 'react';
import { parseStoryToGraph } from '../../../lib/storyMapper';
import { useEditorStore } from '../store/useEditorStore';
import { migrateStory } from '../../../domain/Story/migrations/migrations';

export const useStoryImport = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadStory } = useEditorStore();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const initialParsedData = JSON.parse(content);
        const parsedData = migrateStory(initialParsedData);

        // Simplistic validation to ensure it's our graph format
        if (parsedData && Array.isArray(parsedData.pages) && (parsedData.pages.length === 0 || 'id' in parsedData.pages[0])) {
          const { nodes: parsedNodes, edges: parsedEdges, pages: parsedPages } = parseStoryToGraph(parsedData);
          loadStory({
            nodes: parsedNodes,
            edges: parsedEdges,
            pages: parsedPages,
            variables: parsedData.variables || {},
            items: parsedData.items || {},
            metadata: {
              title: parsedData.title,
              titleLocId: parsedData.titleLocId,
              description: parsedData.description,
              descriptionLocId: parsedData.descriptionLocId,
              startPageId: parsedData.startPageId
            },
            subplots: parsedData.subplots || [],
            audio: parsedData.audio || {},
            atmospheres: parsedData.atmospheres || {},
            statusData: parsedData.statusData || [],
            contextualText: parsedData.contextualText || {},
            derivedTexts: parsedData.derivedTexts || {},
            debugSnapshots: parsedData.debugSnapshots || []
          });
        } else {
          alert("Invalid story format.");
        }
      } catch (error) {
        console.error("Error parsing file", error);
        alert("Failed to parse the file.");
      }

      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return {
    fileInputRef,
    handleImportClick,
    handleFileChange,
  };
};
