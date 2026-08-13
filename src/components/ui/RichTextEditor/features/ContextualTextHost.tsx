import React from 'react';
import type { Editor } from '@tiptap/core';
import type {
  ContextualTextFeature,
  ContextualTextPickerProps,
} from './ContextualTextFeature';

export interface ContextualTextHostProps {
  editor: Editor;
  feature: ContextualTextFeature;
  render: (props: ContextualTextPickerProps) => React.ReactNode;
}

/**
 * Bridges the feature's imperative request into React.
 *
 * The feature is a long-lived object the editor holds, so this subscribes to it:
 * opening a request re-renders, and the feature never needs to know about React.
 * Its own file because the feature module exports a class, and a module mixing
 * both breaks fast refresh.
 */
export const ContextualTextHost: React.FC<ContextualTextHostProps> = ({
  editor,
  feature,
  render,
}) => {
  const [, force] = React.useReducer((tick: number) => tick + 1, 0);

  React.useEffect(() => {
    feature.subscribe(force);
    return () => feature.subscribe(null);
  }, [feature]);

  const request = feature.openRequest;
  if (!request) return null;

  return (
    <>
      {render({
        request,
        onAttach: (entryId) => feature.attach(editor, entryId),
        onCancel: () => feature.closeRequest(),
      })}
    </>
  );
};
