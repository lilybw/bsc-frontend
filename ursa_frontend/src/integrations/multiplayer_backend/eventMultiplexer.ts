import { Logger } from "../../logging/filteredLogger";
import { PlayerID } from "../main_backend/mainBackendDTOs";
import { DEBUG_INFO_EVENT, EventSpecification, EventType, IMessage, PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT } from "./EventSpecifications-v0.0.5";

export type OnEventCallback<T> = (data: T) => void | Promise<void>;
export type SubscriptionID = number;
export type EventID = number;

export interface IEventMultiplexer {
    /**
     * Subscripe to any amount of events.
     * @returns A subscription ID that can be used to unregister all handlers given in this call.
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
    unsubscribe: (subscriptionID: SubscriptionID) => boolean;
    /**
     * Emit an event into the multiplexer. Multiplayer Integration has special access, however all other access
     * must go through this method. 
     * @returns 
     */
    emit: <T extends IMessage>(id: EventType, data: Omit<T, keyof IMessage>) => void;
}

export interface IExpandedAccessMultiplexer extends IEventMultiplexer {

}

export const initializeEventMultiplexer = (log: Logger, player: PlayerID): IExpandedAccessMultiplexer => {
    const plexer = new EventMultiplexerImpl(player);
    const unsubscribeID = plexer.subscribe(
        DEBUG_INFO_EVENT, (data) => {
            log.trace(`[emp debug] ${data.senderID}: ${data.message}`);
        }
    )
    return plexer;
}

class EventMultiplexerImpl implements IExpandedAccessMultiplexer {
    private subscriptions = new Map<EventID, OnEventCallback<any>[]>();
    private registeredHandlers = new Map<SubscriptionID, [EventID, OnEventCallback<any>[]]>();
    private nextSubscriptionID = 0;
    constructor(
        private readonly player: PlayerID
    ){}

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
    }

    unsubscribe = (subscriptionID: SubscriptionID) => {
        const handlerSpecTuple = this.registeredHandlers.get(subscriptionID);
        if (!handlerSpecTuple || handlerSpecTuple === null || !handlerSpecTuple[1] || handlerSpecTuple[1].length === 0) {
            return false;
        }
        for (const handler of handlerSpecTuple[1]) {
            const newSubscriberArray = this.subscriptions.get(handlerSpecTuple[0])?.filter((func) => func !== handler);
            this.subscriptions.set(handlerSpecTuple[0], newSubscriberArray || []);
        }
        return true;
    }

    emit = <T extends IMessage>(id: EventType, data: Omit<T, keyof IMessage>) => {
        const handlers = this.subscriptions.get(id);
        if (!handlers || handlers === null || handlers.length === 0) {
            return;
        }
        const encapsulatedData = Object.freeze({
            ...data,
            senderID: this.player,
            eventID: id
        });
        for (const handler of handlers) {
            handler(encapsulatedData);
        }
    }
}
