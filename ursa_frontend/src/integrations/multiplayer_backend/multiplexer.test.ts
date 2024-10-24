import { test, expect, describe } from 'vitest';
import { Logger } from '../../logging/filteredLogger';
import { initializeEventMultiplexer, OnEventCallback } from './eventMultiplexer';
import { DEBUG_INFO_EVENT, EVENT_ID_MAP, PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT } from './EventSpecifications';

const testLogger: Logger = {
    copyFor: () => testLogger,
    subtrace: () => {},
    trace: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
};

describe('Multiplexer subscribe tests', () => {
    test('When making a subscription, a unique subscription ID must be returned', () => {
        const ids = new Set<number>();
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        const subCount = 10_000;
        for (let i = 0; i < subCount; i++) {
            const id = multiplexer.subscribe(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, () => {});
            ids.add(id);
        }
        expect(ids.size).toEqual(subCount);
    });

    test('When subscribed, the provided handler should be called on any emit of that type of event', async () => {
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        const emitCount = 1000;
        let callCount = 0;
        multiplexer.subscribe(DEBUG_INFO_EVENT, () => {
            callCount++;
        });
        for (let i = 0; i < emitCount; i++) {
            await multiplexer.emit(DEBUG_INFO_EVENT, { message: 'test', code: -1 });
        }
        expect(callCount).toEqual(emitCount);
    });

    test('When initialized, it should invoke the given logger on any debug events', async () => {
        let logCount = 0;
        const logMessages: string[] = [];
        const spyLogger = {
            ...testLogger,
            info: (s: string) => {
                logCount++;
                logMessages.push(s);
            },
            copyFor: () => spyLogger,
        };
        const localPlayerID = 1;
        const plexer = initializeEventMultiplexer(spyLogger, localPlayerID);
        const emitCount = 1000;
        const logMessage = 'test';
        for (let i = 0; i < emitCount; i++) {
            await plexer.emit(DEBUG_INFO_EVENT, { message: logMessage, code: -1 });
        }
        expect(logCount).toEqual(emitCount);
        expect(logMessages).toEqual(new Array(emitCount).fill(`debug event from ${localPlayerID}: ${logMessage}`));
    });

    test('Any amount of handlers can be registered to a single event', async () => {
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        const handlerCount = 1000;
        let callCount = 0;
        for (let i = 0; i < handlerCount; i++) {
            multiplexer.subscribe(DEBUG_INFO_EVENT, () => {
                callCount++;
            });
        }
        await multiplexer.emit(DEBUG_INFO_EVENT, { message: 'test', code: -1 });
        expect(callCount).toEqual(handlerCount);
    });

    test('Only handlers specified for a specific event should be called', async () => {
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        const handlerCount = 1000;
        let callCount = 0;
        for (let i = 0; i < handlerCount; i++) {
            multiplexer.subscribe(DEBUG_INFO_EVENT, () => {
                callCount++;
            });
        }
        await multiplexer.emit(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, {});
        expect(callCount).toEqual(0);
    });

    test('Regardless of event type and handler declaration, if the originSource and eventSource are the same, the handler should not be called', async () => {
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        let callCount = 0;
        const testEventSourceID = 'test';

        const testHandler: OnEventCallback<any> = Object.assign((data: any) => {
            callCount++;
        }, { internalOrigin: testEventSourceID });

        //Subscribing to all events
        Object.values(EVENT_ID_MAP).forEach((spec, id) => {
            multiplexer.subscribe(spec, testHandler);
        });
        //Emitting all events
        await Promise.all(
            Object.values(EVENT_ID_MAP).map(async (spec, id) => {
                await multiplexer.emit(spec, null as any, testEventSourceID);
            })
        );
        await multiplexer.emit(DEBUG_INFO_EVENT, { message: 'test', code: -1 }, testEventSourceID);

        expect(callCount).toEqual(0);
    });

    test('Handlers with declared internalOrigin should only be called if the eventSource does not match, or is undefined', async () => {
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        let callCount = 0;
        const testEventSourceID = 'test';

        const testHandler: OnEventCallback<any> = Object.assign((data: any) => {
            callCount++;
        }, { internalOrigin: testEventSourceID });

        //Subscribing to all events
        Object.values(EVENT_ID_MAP).forEach((spec, id) => {
            multiplexer.subscribe(spec, testHandler);
        });
        const otherEventSource = "other_test";
        //Emitting all events
        await Promise.all(
            Object.values(EVENT_ID_MAP).map(async (spec, id) => {
                //About half get the other event source, the other half get undefined as event source
                await multiplexer.emit(spec, null as any, id % 2 === 0 ? otherEventSource : undefined);
            })
        );

        expect(callCount).toEqual(Object.values(EVENT_ID_MAP).length);
    });

    test('Handlers without declared internalOrigin should be called regardless of eventSource', async () => {
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        let callCount = 0;
        const testHandler: OnEventCallback<any> = (data: any) => {
            callCount++;
        };

        //Subscribing to all events
        Object.values(EVENT_ID_MAP).forEach((spec, id) => {
            multiplexer.subscribe(spec, testHandler);
        });

        //Emitting all events
        await Promise.all(
            Object.values(EVENT_ID_MAP).map(async (spec, id) => {
                //About half get the other event source, the other half get undefined as event source
                await multiplexer.emit(spec, null as any, getRandomString(10));
            })
        );

        expect(callCount).toEqual(Object.values(EVENT_ID_MAP).length);
    });
    const getRandomString = (length: number) => {
        const charset = 'abcdefghijklmnopqrstuvwxyz';
        let res = '';
        for (let i = 0; i < length; i++) {
            res += charset[Math.floor(Math.random() * charset.length)];
        }
        return res;
    };

    test('Compound test, ignored handler and un-ignored handler', async () => {
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        let sharedCallCount = 0;
        const testEventSourceID = 'test';

        const testHandler: OnEventCallback<any> = Object.assign((data: any) => {
            sharedCallCount++;
        }, { internalOrigin: testEventSourceID });

        const testHandler2: OnEventCallback<any> = (data: any) => {
            sharedCallCount++;
        };

        //Subscribing to all events
        Object.values(EVENT_ID_MAP).forEach((spec, id) => {
            multiplexer.subscribe(spec, testHandler);
            multiplexer.subscribe(spec, testHandler2);
        });
        //Emitting all events
        await Promise.all(
            Object.values(EVENT_ID_MAP).map(async (spec, id) => {
                await multiplexer.emit(spec, null as any, testEventSourceID);
            })
        );

        //The handler with matching internalOrigin should not be called
        expect(sharedCallCount).toEqual(Object.values(EVENT_ID_MAP).length);
    })

    test('When unsubscribed, the handler should not be called anymore', async () => {
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        let callCount = 0;
        const handlerID = multiplexer.subscribe(DEBUG_INFO_EVENT, () => {
            callCount++;
        });
        await multiplexer.emit(DEBUG_INFO_EVENT, { message: 'test', code: -1 });
        multiplexer.unsubscribe(handlerID);
        await multiplexer.emit(DEBUG_INFO_EVENT, { message: 'test', code: -1 });
        expect(callCount).toEqual(1);
    });
});
