import type { Action } from '../Actions/Action';
import type { Conditional } from '../Conditionals/Conditional';

export interface ItemContextChoice {
  id: string;
  text: string;
  textLocId?: string;
  actions?: Action[];
  conditionals?: Conditional[];
}

export interface Item {
  id: string;
  name: string;
  nameLocId?: string;
  description: string;
  descriptionLocId?: string;
  imageUrl?: string;
  tags: string[];
  multiple: boolean;
  contextChoices: ItemContextChoice[];
}
