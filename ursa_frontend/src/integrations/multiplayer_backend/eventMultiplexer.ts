import { DEBUG_INFO_EVENT, EventSpecification, EventType, IMessage, PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT } from "./EventSpecifications-v0.0.5";

export type OnEventCallback<T> = (data: T) => void;
export type SubscriptionID = number;
type EventHandlerDeclaration<T> = [EventSpecification<T>, OnEventCallback<T>];

export interface IEventMultiplexer {
    /**
     * Subscripe to any amount of events.
     * @returns A subscription ID that can be used to unregister all handlers given in this call.
     * 
     * Usage
     * ```typescript
     * const subscriptionID = multiplexer.subscribe(
     *     DEBUG_INFO_EVENT, (data) => { ... },
     *     PLAYER_JOINED_EVENT, (data) => { ...}
     * );
     */
    subscribe: (args: { [K in keyof EventSpecification<K>]: OnEventCallback<[K]> }) => SubscriptionID;
    unsubscribe: (subscriptionID: SubscriptionID) => void;
    /**
     * Emit an event into the multiplexer. Multiplayer Integration has special access, however all other access
     * must go through this method. 
     * @returns 
     */
    emit: <T extends IMessage>(id: EventType, data: Omit<T, keyof IMessage>) => void;
}

export const initializeEventMultiplexer = (): IEventMultiplexer => {
    const plexer = new EventMultiplexerImpl();
    return plexer as unknown as IEventMultiplexer;
}

class EventMultiplexerImpl implements IEventMultiplexer {
    private subscriptions = new Map<EventSpecification<any>, OnEventCallback<any>[]>();
    private registeredHandlers = new Map<SubscriptionID, EventHandlerDeclaration<any>>();
    private nextSubscriptionID = 0;
    constructor(
    ){

    }
    subscribe = (args: { [K in keyof EventSpecification<K>]: OnEventCallback<[K]> }) => {
        throw new Error("Method not implemented.");
    }
    unsubscribe = (subscriptionID: SubscriptionID) => {
        throw new Error("Method not implemented.");
    }
    emit = <T extends IMessage>(id: EventType, data: Omit<T, keyof IMessage>) => {
        throw new Error("Method not implemented.");
    }
}
