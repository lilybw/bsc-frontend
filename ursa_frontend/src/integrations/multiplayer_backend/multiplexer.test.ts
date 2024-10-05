import {test, expect, describe} from 'vitest';
import { Logger } from "../../logging/filteredLogger";
import { initializeEventMultiplexer } from './eventMultiplexer';
import { DEBUG_INFO_EVENT, PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT } from './EventSpecifications-v0.0.7';

const testLogger: Logger = {
    trace: () => {},
    log: () => {},
    warn: () => {},
    error: () => {},
}

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
        multiplexer.subscribe(DEBUG_INFO_EVENT, () => {callCount++});
        for (let i = 0; i < emitCount; i++) {
            await multiplexer.emit(DEBUG_INFO_EVENT, {message: "test", code: -1});
        }
        expect(callCount).toEqual(emitCount);
    })

    test('When initialized, it should invoke the given logger on any debug events', async () => {
        let logCount = 0;
        const logMessages: string[] = []
        const spyLogger = {...testLogger, log: (s: string) => {logCount++; logMessages.push(s)}};
        const localPlayerID = 1;
        const plexer = initializeEventMultiplexer(spyLogger, localPlayerID);
        const emitCount = 1000;
        const logMessage = "test";
        for (let i = 0; i < emitCount; i++) {
            await plexer.emit(DEBUG_INFO_EVENT, {message: logMessage, code: -1});
        }
        expect(logCount).toEqual(emitCount);
        expect(logMessages).toEqual(new Array(emitCount).fill(`[emp debug] from ${localPlayerID}: ${logMessage}`));
    })

    test('Any amount of handlers can be registered to a single event', async () => {
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        const handlerCount = 1000;
        let callCount = 0;
        for (let i = 0; i < handlerCount; i++) {
            multiplexer.subscribe(DEBUG_INFO_EVENT, () => {callCount++});
        }
        await multiplexer.emit(DEBUG_INFO_EVENT, {message: "test", code: -1});
        expect(callCount).toEqual(handlerCount);
    })

    test('Only handlers specified for a specific event should be called', async () => {
        const multiplexer = initializeEventMultiplexer(testLogger, 1);
        const handlerCount = 1000;
        let callCount = 0;
        for (let i = 0; i < handlerCount; i++) {
            multiplexer.subscribe(DEBUG_INFO_EVENT, () => {callCount++});
        }
        await multiplexer.emit(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, {});
        expect(callCount).toEqual(0);
    })
})