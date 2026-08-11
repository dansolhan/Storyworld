import { createStore, type StoreApi } from 'zustand/vanilla';
import type { EngineState, StoryMessage, StoryEffect, PlayerMessage } from './types';
import type { StoryVariable } from '../../domain/Story/Variable';
import { atmosphereSettings } from '../../domain/Atmosphere/atmosphereSettings';
import type { StoryData } from '../../domain/Story/StoryData';
import type { ActionContext } from '../../domain/Actions/Action';
import { executeLogicTree } from './logic/executeLogicTree';
import { evaluateVisibility } from './logic/evaluator';
import { actionBlueprints } from '../../domain/Actions/registry';
import type { StoryEvent } from '../../domain/Events/StoryEvent';
import { conditionalsToLogicTree } from '../../domain/Conditionals/conditionalsToLogicTree';

/**
 * The mutable scratch object an action batch writes into before the engine
 * commits it. Which fields are present depends on what the batch is allowed to
 * do — only choice selection can prevent a move, only hover can override text —
 * so the optional fields are guarded with `in` checks at the point of use.
 */
interface ActionScriptState {
  variables: Record<string, StoryVariable>;
  inventory: Record<string, number>;
  newMessages: PlayerMessage[];
  nextTargetId?: string;
  navigateToPage?: string | null;
  preventMove?: boolean;
  choiceTextOverride?: string;
}

export class StoryEngine {
  public store: StoreApi<EngineState>;
  private effectListeners: ((effect: StoryEffect) => void)[] = [];

  constructor() {
    this.store = createStore<EngineState>(() => ({
      storyData: null,
      currentPageId: undefined,
      visitedPageIds: [],
      variables: {},
      inventory: {},
      messages: [],
    }));
  }

  public subscribe(listener: (state: EngineState) => void) {
    return this.store.subscribe(listener);
  }

  public onEffect(listener: (effect: StoryEffect) => void) {
    this.effectListeners.push(listener);
    return () => {
      this.effectListeners = this.effectListeners.filter((l) => l !== listener);
    };
  }

  private emitEffect(effect: StoryEffect) {
    this.store.setState({ lastEffect: effect });
    this.effectListeners.forEach((l) => l(effect));
  }

  public dispatch(message: StoryMessage) {
    switch (message.type) {
      case 'INITIALIZE':
        this.initialize(message.payload.storyData, message.payload.startPageId);
        break;
      case 'SELECT_CHOICE':
        this.selectChoice(message.payload.choiceId, message.payload.targetPageId);
        break;
      case 'HOVER_CHOICE':
        this.hoverChoice(message.payload.choiceId, message.payload.isHovering);
        break;
      case 'EXECUTE_ITEM_CHOICE':
        this.executeItemChoice(message.payload.itemId, message.payload.choiceId);
        break;
      case 'RESTART':
        this.restart();
        break;
    }
  }

  private initialize(storyData: StoryData, startPageId?: string) {
    const defaultStartId = startPageId || storyData?.startPageId || storyData?.pages?.[0]?.id;
    
    this.store.setState({
      storyData,
      currentPageId: defaultStartId,
      visitedPageIds: [],
      variables: storyData.variables || {},
      inventory: {},
      messages: [],
      choiceOverrides: {},
      lastEffect: undefined
    });

    if (defaultStartId) {
      this.enterPage(defaultStartId);
    }
  }

  private restart() {
    const { storyData } = this.store.getState();
    if (storyData) {
      this.initialize(storyData);
    }
  }

  private selectChoice(choiceId: string, targetPageId?: string) {
    const state = this.store.getState();
    const currentPage = state.storyData?.pages.find(p => p.id === state.currentPageId);
    const choice = currentPage?.choices.find(c => c.id === choiceId);
    
    if (!choice) return;

    // Create contexts for logic execution
    const scriptState = {
      variables: { ...state.variables },
      inventory: { ...state.inventory },
      newMessages: [] as PlayerMessage[],
      nextTargetId: targetPageId,
      preventMove: false
    };

    const actionContext = this.createActionContext(scriptState, state.currentPageId);

    const evalContext = {
      variables: scriptState.variables,
      visitedPageIds: state.visitedPageIds,
      currentPageId: state.currentPageId,
      inventory: scriptState.inventory
    };

    // Execute events
    const clickEvents = choice.events?.filter(e => e.name === 'onSelect' || e.name === 'onClick') || [];
    clickEvents.forEach(event => {
      executeLogicTree(event.logicTree || [], evalContext, actionContext);
    });

    // Update state
    this.store.setState({
      variables: scriptState.variables,
      inventory: scriptState.inventory,
      messages: [...state.messages, ...scriptState.newMessages]
    });

    if (!scriptState.preventMove && scriptState.nextTargetId) {
      this.enterPage(scriptState.nextTargetId);
    }
  }

  private hoverChoice(choiceId: string, isHovering: boolean) {
    const state = this.store.getState();
    const currentPage = state.storyData?.pages.find(p => p.id === state.currentPageId);
    const choice = currentPage?.choices.find(c => c.id === choiceId);
    
    if (!choice) return;

    if (!isHovering) {
        // Clear hover text change
        const nextOverrides = { ...state.choiceOverrides };
        if (nextOverrides[choiceId]) {
             delete nextOverrides[choiceId].text;
             if (Object.keys(nextOverrides[choiceId]).length === 0) delete nextOverrides[choiceId];
        }
        this.store.setState({ choiceOverrides: nextOverrides });
        return;
    }

    const scriptState = {
      variables: { ...state.variables },
      inventory: { ...state.inventory },
      newMessages: [] as PlayerMessage[],
      choiceTextOverride: undefined as string | undefined,
    };

    const actionContext = this.createActionContext(scriptState, state.currentPageId);

    const evalContext = {
      variables: scriptState.variables,
      visitedPageIds: state.visitedPageIds,
      currentPageId: state.currentPageId,
      inventory: scriptState.inventory
    };

    const hoverEvents = choice.events?.filter(e => e.name === 'onHover') || [];
    if (hoverEvents.length === 0) return;

    hoverEvents.forEach(event => {
      executeLogicTree(event.logicTree || [], evalContext, actionContext);
    });

    if (scriptState.choiceTextOverride !== undefined) {
         const nextOverrides = { ...state.choiceOverrides };
         nextOverrides[choiceId] = { ...nextOverrides[choiceId], text: scriptState.choiceTextOverride };
         this.store.setState({ choiceOverrides: nextOverrides });
    }
  }

  private executeItemChoice(itemId: string, choiceId: string) {
    const state = this.store.getState();
    const item = state.storyData?.items?.[itemId];
    const choice = item?.contextChoices.find(c => c.id === choiceId);
    if (!choice) return;

    const scriptState = {
      variables: { ...state.variables },
      inventory: { ...state.inventory },
      newMessages: [] as PlayerMessage[],
      nextTargetId: undefined as string | undefined,
    };

    const actionContext = this.createActionContext(scriptState, state.currentPageId);

    const evalContext = {
      variables: scriptState.variables,
      visitedPageIds: state.visitedPageIds,
      currentPageId: state.currentPageId,
      inventory: scriptState.inventory
    };

    if (choice.actions) {
       choice.actions.forEach(action => {
          if (action.conditionals && action.conditionals.length > 0) {
            const syntheticEvent: StoryEvent = {
              id: 'synthetic',
              name: 'onEvaluate',
              logicTree: conditionalsToLogicTree(action.conditionals),
            };
            if (!evaluateVisibility({ events: [syntheticEvent] }, evalContext)) return;
          }
          const blueprint = actionBlueprints[action.blueprintId];
          if (blueprint) {
            blueprint.execute(action.params, actionContext);
          }
       });
    }

    this.store.setState({
      variables: scriptState.variables,
      inventory: scriptState.inventory,
      messages: [...state.messages, ...scriptState.newMessages]
    });

    if (scriptState.nextTargetId) {
      this.enterPage(scriptState.nextTargetId);
    }
  }

  private enterPage(pageId: string) {
    const state = this.store.getState();
    const page = state.storyData?.pages.find(p => p.id === pageId);
    if (!page) return;

    // Track visit
    const nextVisited = [...state.visitedPageIds];
    if (!nextVisited.includes(pageId)) {
      nextVisited.push(pageId);
    }

    this.store.setState({ 
      currentPageId: pageId,
      visitedPageIds: nextVisited
    });

    // Atmosphere effect
    if (page.atmosphereId) {
      const atmo = state.storyData?.atmospheres?.[page.atmosphereId];
      if (atmo?.music) {
        // The atmosphere decides how its track comes in, not the adapter.
        const { fadeIn, volume } = atmosphereSettings(atmo);
        this.emitEffect({
          type: 'PLAY_SOUND',
          payload: { soundId: atmo.music, category: 'bgm', fadeIn, volume },
        });
      }
    }

    // OnEnter events
    const enterEvents = page.events?.filter(e => e.name === 'onEnter') || [];
    if (enterEvents.length > 0) {
        // Redo the script context for enter events
        const innerState = this.store.getState();
        const scriptState = {
            variables: { ...innerState.variables },
            inventory: { ...innerState.inventory },
            newMessages: [] as PlayerMessage[],
            navigateToPage: null as string | null,
        };

        const actionContext = this.createActionContext(scriptState, pageId);

        const evalContext = {
            variables: scriptState.variables,
            visitedPageIds: innerState.visitedPageIds,
            currentPageId: pageId,
            inventory: scriptState.inventory
        };

        enterEvents.forEach(event => {
            executeLogicTree(event.logicTree || [], evalContext, actionContext);
        });

        this.store.setState({
            variables: scriptState.variables,
            inventory: scriptState.inventory,
            messages: [...innerState.messages, ...scriptState.newMessages]
        });

        if (scriptState.navigateToPage) {
            this.enterPage(scriptState.navigateToPage);
        }
    }
  }

  // Derived state helper for UI
  public getVisibleContent(pageId: string) {
    const state = this.store.getState();
    const page = state.storyData?.pages.find(p => p.id === pageId);
    if (!page) return { paragraphs: [], choices: [] };

    const context = {
      variables: state.variables,
      visitedPageIds: state.visitedPageIds,
      currentPageId: pageId,
      inventory: state.inventory
    };


    return {
      paragraphs: page.paragraphs.filter(p => evaluateVisibility(p, context)),
      choices: page.choices.filter(c => evaluateVisibility(c, context)).map(c => {
         const override = state.choiceOverrides?.[c.id];
         if (override && override.text) {
             return { ...c, text: override.text };
         }
         return c;
      })
    };
  }

  private createActionContext(scriptState: ActionScriptState, currentPageId?: string): ActionContext {
    return {
      variables: scriptState.variables,
      setVariable: (key: string, value: unknown) => {
          const currentVar = scriptState.variables[key];
          const type = currentVar ? currentVar.type : (typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string');
          scriptState.variables[key] = { 
            type, 
            value: type === 'number' ? Number(value) : type === 'boolean' ? Boolean(value) : String(value) 
          };
      },
      modifyInventory: (itemId: string, amount: number) => {
          const current = scriptState.inventory[itemId] || 0;
          const next = current + amount;
          if (next <= 0) delete scriptState.inventory[itemId];
          else scriptState.inventory[itemId] = next;
      },
      postMessage: (text: string, displayStyle?: 'styled' | 'paragraph') => {
          scriptState.newMessages.push({
              id: crypto.randomUUID(),
              text,
              displayStyle: displayStyle || 'styled',
              pageId: scriptState.nextTargetId || scriptState.navigateToPage || currentPageId
          });
      },
      goToPage: (id: string) => {
          if (scriptState.nextTargetId !== undefined) scriptState.nextTargetId = id;
          if (scriptState.navigateToPage !== undefined) scriptState.navigateToPage = id;
          scriptState.newMessages.forEach((message) => { if (!message.pageId) message.pageId = id; });
      },
      preventMove: () => {
          if ('preventMove' in scriptState) scriptState.preventMove = true;
      },
      setChoiceText: (text: string) => {
          if ('choiceTextOverride' in scriptState) scriptState.choiceTextOverride = text;
      },
      endStory: (data: Record<string, unknown>) => {
        this.emitEffect({ type: 'ON_STORY_END', payload: { data } });
      },
      playSound: (soundId: string, category: 'bgm' | 'sfx') => {
        this.emitEffect({ type: 'PLAY_SOUND', payload: { soundId, category } });
      },
      stopAllSounds: () => {
        this.emitEffect({ type: 'STOP_ALL_SOUNDS' });
      }
    };
  }
}
