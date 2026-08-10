import { useShallow } from 'zustand/react/shallow';
import { useEditorStore } from '../../store/useEditorStore';
import type { InspectorTab } from '../../store/inspectorTab';

export interface InspectorTabState {
  inspectorTab: InspectorTab;
  setInspectorTab: (tab: InspectorTab) => void;
}

export const useInspectorTab = (): InspectorTabState =>
  useEditorStore(
    useShallow((state) => ({
      inspectorTab: state.inspectorTab,
      setInspectorTab: state.setInspectorTab,
    }))
  );
