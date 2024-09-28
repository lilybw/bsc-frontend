import { EVENTS } from "./EventSpecifications"

export type OnEventCallback = any;
export type SubscriptionID = number;

export type EventMultiplexer = {
    subscribe: (id: EVENTS, callback: OnEventCallback) => SubscriptionID ;
}