import { EventSpecification, EventType } from "./EventSpecifications-v0.0.5";

export type OnEventCallback<T> = (data: T) => void;
export type SubscriptionID = number;

export interface EventMultiplexer {
    subscribe: <T>(event: EventSpecification<T>, callback: OnEventCallback<T>) => SubscriptionID;
    unsubscribe: (subscriptionID: SubscriptionID) => void;
}

export const initializeEventMultiplexer = (): EventMultiplexer => {

    return null as any;
}