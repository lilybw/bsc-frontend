import { uint32 } from '../main_backend/mainBackendDTOs';
import { OriginType } from './EventSpecifications';

export type ClientDTO = {
    id: uint32;
    IGN: string;
    type: OriginType;
    state: {
        /**
         * ID of colony location
         */
        lastKnownPosition: uint32;
        msOfLastMessage: uint32;
    };
};

export type LobbyStateResponseDTO = {
    colonyID: uint32;
    closing: boolean;
    phase: uint32;
    encoding: string; // binary | base32 | base64
    clients: ClientDTO[];
};

export type HealthCheckDTO = {
    status: boolean;
    lobbyCount: uint32;
};
