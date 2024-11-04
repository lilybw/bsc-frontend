// src/utils/demoUtils.ts

import { createSignal } from 'solid-js';
import { KnownLocations } from '@/integrations/main_backend/constants';
import { LocationInfoResponseDTO, ColonyInfoResponseDTO, ColonyLocationInformation } from '@/integrations/main_backend/mainBackendDTOs';
import { createMockEvents, createMockMultiplayer } from './tutorialUtils';

export interface DemoPhaseManager<T extends string> {
    phase: () => T;
    setPhase: (newPhase: T | ((prev: T) => T)) => void;
    transition: (nextPhase: T, delayMs?: number) => void;
}

export const createDemoPhaseManager = <T extends string>(initialPhase: T): DemoPhaseManager<T> => {
    const [phase, setPhase] = createSignal<T>(initialPhase);

    return {
        phase,
        setPhase: (newPhase) => {
            if (typeof newPhase === 'function') {
                setPhase(newPhase);
            } else {
                setPhase(() => newPhase);
            }
        },
        transition: (nextPhase: T, delayMs = 0) => {
            if (delayMs) {
                setTimeout(() => setPhase(() => nextPhase), delayMs);
            } else {
                setPhase(() => nextPhase);
            }
        }
    };
};

export const createDefaultLocationInfo = (
    locationId: KnownLocations = KnownLocations.Home,
    nameKey: string = 'LOCATION.HOME.NAME',
    descriptionKey: string = 'LOCATION.HOME.DESCRIPTION'
): LocationInfoResponseDTO => ({
    id: locationId,
    name: nameKey,
    description: descriptionKey,
    appearances: [{ level: 0, splashArt: 1010, assetCollectionID: 1 }],
    minigameID: 0
});

export const createDefaultColony = (locationId: KnownLocations = KnownLocations.Home): {
    colony: ColonyInfoResponseDTO;
    colonyLocation: ColonyLocationInformation;
} => ({
    colony: {
        id: 1,
        name: "Tutorial Colony",
        accLevel: 1,
        latestVisit: new Date().toISOString(),
        assets: [],
        locations: []
    },
    colonyLocation: {
        id: 1,
        locationID: locationId,
        level: 0,
        transform: {
            xOffset: 0,
            yOffset: 0,
            zIndex: 1,
            xScale: 1,
            yScale: 1
        }
    }
});

export const createDemoEnvironment = (locationId: KnownLocations = KnownLocations.Home) => {
    const { colony, colonyLocation } = createDefaultColony(locationId);
    return {
        events: createMockEvents(),
        multiplayer: createMockMultiplayer(),
        colony,
        colonyLocation,
        locationInfo: createDefaultLocationInfo(locationId)
    };
};