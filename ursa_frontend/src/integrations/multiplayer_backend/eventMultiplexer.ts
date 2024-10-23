import { Logger } from '../../logging/filteredLogger';
import { PlayerID } from '../main_backend/mainBackendDTOs';
import { DEBUG_INFO_EVENT, EventSpecification, EventType, IMessage, PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT } from './EventSpecifications';

export type OnEventCallback<T> = (data: T) => void | Promise<void>;
export type SubscriptionID = number;
export type EventID = number;

export interface IEventMultiplexer {
    /**
     * Subscripe to any amount of events. The callback given is queued as a micro task when an event of the specified type is emitted.
     * @returns A subscription ID that can be used to unregister the handler given in this call.
     *
     * Usage
     * ```typescript
     * const subscriptionID = multiplexer.subscribe(
     *     DEBUG_INFO_EVENT, (data) => { ... }
     * );
     */
    subscribe: <T extends IMessage>(spec: EventSpecification<T>, callback: OnEventCallback<T>) => SubscriptionID;
    /**
     * @returns Whether any handlers were unregistered.
     */
    unsubscribe: (...subscriptionIDs: SubscriptionID[]) => boolean;
    /**
     * Emit an event into the multiplexer. Multiplayer Integration has special access, however all other access
     * must go through this method.
     * @returns
     */
    emit: <T extends IMessage>(spec: EventSpecification<T>, data: Omit<T, keyof IMessage>) => Promise<void>;
}

/**
 * Normal IEventMultiplexer but with the option to emit raw events without restrictions.
 */
export interface IExpandedAccessMultiplexer extends IEventMultiplexer {
    emitRAW: <T extends IMessage>(data: T) => Promise<void>;
}

export const initializeEventMultiplexer = (logger: Logger, localPlayer: PlayerID): IExpandedAccessMultiplexer => {
    const log = logger.copyFor('events');
    const plexer = new EventMultiplexerImpl(localPlayer, log);
    const unsubscribeID = plexer.subscribe(DEBUG_INFO_EVENT, (data) => {
        log.info(`debug event from ${data.senderID}: ${data.message}`);
    });
    return plexer;
};

class EventMultiplexerImpl implements IExpandedAccessMultiplexer {
    private readonly subscriptions = new Map<EventID, OnEventCallback<any>[]>();
    private readonly registeredHandlers = new Map<SubscriptionID, [EventID, OnEventCallback<any>[]]>();
    private nextSubscriptionID = 0;
    constructor(
        private readonly player: PlayerID,
        private readonly log: Logger
    ) {}

    subscribe = <T extends IMessage>(spec: EventSpecification<T>, callback: OnEventCallback<T>) => {
        let handlerArr = this.subscriptions.get(spec.id);
        if (!handlerArr || handlerArr === null) {
            handlerArr = [];
        }
        const id = this.nextSubscriptionID++;
        this.registeredHandlers.set(id, [spec.id, [callback]]);
        handlerArr.push(callback);
        this.subscriptions.set(spec.id, handlerArr);
        return id;
    };

    unsubscribe = (...subscriptionIDs: SubscriptionID[]) => {
        let anyWasRemoved = false;
        for (const subscriptionID of subscriptionIDs) {
            const handlerSpecTuple = this.registeredHandlers.get(subscriptionID);
            if (!handlerSpecTuple || handlerSpecTuple === null || !handlerSpecTuple[1] || handlerSpecTuple[1].length === 0) {
                continue;
            }
            for (const handler of handlerSpecTuple[1]) {
                const newSubscriberArray = this.subscriptions.get(handlerSpecTuple[0])?.filter((func) => func !== handler);
                this.subscriptions.set(handlerSpecTuple[0], newSubscriberArray || []);
            }
            anyWasRemoved = anyWasRemoved || true;
        }
        return anyWasRemoved;
    };

    emit = async <T extends IMessage>(spec: EventSpecification<T>, data: Omit<T, keyof IMessage>) => {
        const encapsulatedData = Object.freeze({
            ...data,
            senderID: this.player,
            eventID: spec.id,
        });
        this.emitRAW(encapsulatedData);
    };

    emitRAW = async <T extends IMessage>(data: T) => {
        const handlers = this.subscriptions.get(data.eventID);
        if (!handlers || handlers === null || handlers.length === 0) {
            return;
        }
        // Use Promise.all with queueMicrotask for better performance
        await Promise.all(handlers.map(handler => new Promise<void>(resolve => {
            queueMicrotask(() => {
                handler(data);
                resolve();
            });
        })));
    };
}
