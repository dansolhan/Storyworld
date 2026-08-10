import React from 'react';
import { Popover } from '../../../../../components/ui/Popover/Popover';
import { EndDataEditor, endStoryFields } from './EndDataEditor';
import { PageSelection } from './popovers/PageSelection';
import { SubplotSelection } from './popovers/SubplotSelection';
import { VariableSelection } from './popovers/VariableSelection';
import { ValueInput } from './popovers/ValueInput';
import { MessageInput } from './popovers/MessageInput';
import { DisplayStyleSelection } from './popovers/DisplayStyleSelection';
import { CountInput } from './popovers/CountInput';
import { ComparisonSelection } from './popovers/ComparisonSelection';
import { ItemSelection } from './popovers/ItemSelection';

interface BlueprintPopoverProps {
  isOpen: boolean;
  x: number;
  y: number;
  tokenTarget: string;
  onClose: () => void;
  params: Record<string, unknown>;
  onChangeParam: (key: string, value: unknown) => void;
  inputValue: string;
  setInputValue: (val: string) => void;
  pageOptions: { label: string; value: string }[];
  targetPageOptions: { label: string; value: string }[];
  subplotOptions: { label: string; value: string }[];
  variableOptions: { label: string; value: string }[];
  itemOptions: { label: string; value: string }[];
}

export const BlueprintPopover: React.FC<BlueprintPopoverProps> = ({
  isOpen,
  x,
  y,
  tokenTarget,
  onClose,
  params,
  onChangeParam,
  inputValue,
  setInputValue,
  pageOptions,
  targetPageOptions,
  subplotOptions,
  variableOptions,
  itemOptions,
}) => {
  const renderContent = () => {
    switch (tokenTarget) {
      case 'pageId':
        return (
          <PageSelection
            title="Select a page:"
            options={pageOptions}
            onSelect={(val) => {
              onChangeParam('pageId', val);
              onClose();
            }}
          />
        );

      case 'targetPageId':
        return (
          <PageSelection
            title="Select a target page:"
            options={targetPageOptions}
            onSelect={(val) => {
              onChangeParam('targetPageId', val);
              onClose();
            }}
          />
        );

      case 'subplotId':
        return (
          <SubplotSelection
            options={subplotOptions}
            onSelect={(val) => {
              if (params['subplotId'] !== val) {
                onChangeParam('targetPageId', null);
              }
              onChangeParam('subplotId', val);
              onClose();
            }}
          />
        );

      case 'variableKey':
        return (
          <VariableSelection
            options={variableOptions}
            onSelect={(val) => {
              onChangeParam('variableKey', val);
              onClose();
            }}
          />
        );

      case 'value':
        return (
          <ValueInput
            value={inputValue}
            onChange={setInputValue}
            onSave={(val) => {
              onChangeParam('value', val);
              onClose();
            }}
          />
        );

      case 'message':
        return (
          <MessageInput
            value={inputValue}
            onChange={setInputValue}
            onSave={(val) => {
              onChangeParam('message', val);
              onClose();
            }}
          />
        );

      case 'displayStyle':
        return (
          <DisplayStyleSelection
            onSelect={(val) => {
              onChangeParam('displayStyle', val);
              onClose();
            }}
          />
        );

      case 'count':
        return (
          <CountInput
            value={inputValue}
            onChange={setInputValue}
            onSave={(val) => {
              onChangeParam('count', val);
              onClose();
            }}
          />
        );

      case 'comparison':
        return (
          <ComparisonSelection
            onSelect={(val) => {
              onChangeParam('comparison', val);
              onClose();
            }}
          />
        );

      case 'itemId':
        return (
          <ItemSelection
            options={itemOptions}
            onSelect={(val) => {
              onChangeParam('itemId', val);
              onClose();
            }}
          />
        );

      case 'data':
        return (
          <EndDataEditor
            data={endStoryFields(params.data)}
            variableOptions={variableOptions}
            onChange={(newData) => onChangeParam('data', newData)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Popover isOpen={isOpen} x={x} y={y} onClose={onClose}>
      {renderContent()}
    </Popover>
  );
};
