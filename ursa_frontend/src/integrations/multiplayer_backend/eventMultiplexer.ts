import { Logger } from '../../logging/filteredLogger';
import { PlayerID, uint32 } from '../main_backend/mainBackendDTOs';
import { DEBUG_INFO_EVENT, EventSpecification, EventType, IMessage, PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT } from './EventSpecifications';

export type OnEventCallback<T> = ((data: T) => void | Promise<void>) & { internalOrigin?: string };
export type SubscriptionID = number;
export type EventID = number;

export interface IEventMultiplexer {
    /**
     * Subscripe to an event. The callback given is queued as a micro task when an event of the specified type is emitted.
     * @returns A subscription ID that can be used to unregister the handler given in this call.
     *
     * Usage
     * ```ts
     * | const subscriptionID = multiplexer.subscribe(
     * |    DEBUG_INFO_EVENT, (data) => { ... }
     * | );
     * ```
     * Or with internalOrigin to prevent echoes:
     * ```ts
     * | const subscriptionID = multiplexer.subscribe(
     * |    DEBUG_INFO_EVENT, Object.assign(
     * |      (data) => { ... },
     * |      { internalOrigin: 'some identifier' }
     * |    )
     * | );
     * ```
     */
    subscribe: <T extends IMessage>(spec: EventSpecification<T>, callback: OnEventCallback<T>) => SubscriptionID;
    /**
     * @returns Whether any handlers were unregistered.
     */
    unsubscribe: (...subscriptionIDs: SubscriptionID[]) => boolean;
    /**
     * Emit an event into the multiplexer. Multiplayer Integration has special access, however all other access
     * must go through this method.
     * @param internalOrigin optionally used to exclude any handlers that is of same origin.
     * @returns amount of handlers invoked.
     */
    emit: <T extends IMessage>(spec: EventSpecification<T>, data: Omit<T, keyof IMessage>, internalOrigin?: string) => Promise<uint32>;
}

/**
 * Normal IEventMultiplexer but with the option to emit raw events without restrictions.
 */
export interface IExpandedAccessMultiplexer extends IEventMultiplexer {
    /**
     * @param data the data to send including the eventID and senderID. Use the type param to get intellisense for the type of data.
     * @param internalOrigin optionally used to exclude any handlers that is of same origin.
     * @returns amount of handlers invoked.
     */
    emitRAW: <T extends IMessage>(data: T, internalOrigin?: string) => Promise<uint32>;
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
        private readonly log: Logger,
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

    emit = async <T extends IMessage>(spec: EventSpecification<T>, data: Omit<T, keyof IMessage>, internalOrigin?: string) => {
        const encapsulatedData = Object.freeze({
            ...data,
            senderID: this.player,
            eventID: spec.id,
        });
        return this.emitRAW(encapsulatedData, internalOrigin);
    };

    emitRAW = async <T extends IMessage>(data: T, internalOrigin?: string) => {
        const handlers = this.subscriptions.get(data.eventID);
        if (!handlers || handlers === null || handlers.length === 0) {
            return 0;
        }
        let handlerInvocationCount = 0;

        await Promise.all(
            handlers
                // Filter out handlers that are of same origin as the event source
                // h.internalOrigin can be undefined, as it is not required, but if it is, the comparison will not be made.
                // Otherwise, as eventSource also is allowed to be undefined, all handlers with no specified origin,
                // would be excluded on any emission not specifying an eventSource.
                .filter((h) => (h.internalOrigin ? h.internalOrigin !== internalOrigin : true))
                .map(
                    (handler) =>
                        new Promise<void>((resolve) => {
                            queueMicrotask(() => {
                                handler(data);
                                handlerInvocationCount++;
                                resolve();
                            });
                        }),
                ),
        );
        this.log.subtrace(`Emitted event ${data.eventID} to ${handlerInvocationCount} handlers`);
        return handlerInvocationCount;
    };
}
