import { MIMEType } from "util";
import { ArbitraryResponseDefinition, ParseMethod } from "../../meta/types";

/**
 * The writer of this type is aware that JS/TS does not distinguish between signed and unsigned integers.
 * However, it does imply that any negative value would be an error. 
 */ 
export type uint32 = number;
export type AssetID = uint32;
export type AssetCollectionID = uint32;
export type MinigameID = uint32;
export type LocationID = uint32;
export type ColonyCode = uint32;
export type MinigameDifficultyID = uint32;
export type PlayerInfoResponseDTO = {
    id: uint32;
    firstName: string;
    lastName: string;
    sprite: AssetID;
    achievements: uint32[];
    hasCompletedTutorial: boolean;
}
export type PlayerPreferenceDTO = {
    id: uint32;
    key: string;
    chosenValue: string;
    availableValues: string[];
}
export type PlayerPreferencesResponseDTO = {
    preferences: PlayerPreferenceDTO[]
}

export type InternationalizationCatalogueResponseDTO = {[key: string]: string}

export type ColonyInfoResponseDTO = {
    id: uint32;
    accLevel: uint32;
    name: string;
    latestVisit: string;
    assets: {
        assetCollectionID: AssetCollectionID;
        transform: TransformDTO;
    }[];
    locations: {
        level: uint32;
        locationID: LocationID;
        transform: TransformDTO;
    }
}

export type CreateColonyResponseDTO = ColonyInfoResponseDTO;
export type ColonyOverviewReponseDTO = {
    colonies: ColonyInfoResponseDTO[];
}

export type LocationInfoResponseDTO = {
    id: LocationID;
    name: string;
    description: string;
    assetCollectionIDs: AssetID[];
    minigameID: MinigameID;
}

export type LocationInfoFullResponseDTO = {
    id: LocationID;
    name: string;
    description: string;
    transform: TransformDTO;
    appearances: {
        level: uint32;
        assets: {
            transform: TransformDTO;
            asset: MinimizedAssetDTO;
        }[]
    }[];
    minigame: {
        id: MinigameID;
        name: string;
        description: string;
        iconID: AssetID;
        difficulties: {
            name: string;
            description: string;
            iconID: AssetID;
        }[];
    }
}

export type AssetResponseDTO = {
    id: AssetID;
    useCase: AssetUseCase;
    type: MIMEType;
    width: uint32;
    height: uint32;
    alias: string;
    LODs: {
        detailLevel: uint32;
        id: AssetID;
    }[]
}

export type AssetsResponseDTO = AssetResponseDTO[];

export interface LODResponse extends ArbitraryResponseDefinition<{
    "Ursa-Detail-Level": uint32;
}> {
    bodyParseMethod: ParseMethod.BLOB;
}

export type OpenColonyResponseDTO = {
    code: ColonyCode;
    lobbyID: uint32;
    /**
     * Base url: protocol://host:port
     */
    multiplayerServerAddress: string;
}

export type JoinColonyResponseDTO = {
    lobbyID: uint32;
    /**
     * Base url: protocol://host:port
     */
    multiplayerServerAddress: string;
}

export type AssetCollectionResponseDTO = {
    id: AssetCollectionID;
    name: string;
    entries: {
        transform: TransformDTO;
        asset: MinimizedAssetDTO;
    }[];
}

export type MinigameInfoResponseDTO = {
    id: MinigameID;
    name: string;
    icon: AssetID;
    description: string;
    /**
     * Some JS object
     */
    settings: any;
    difficulties: {
        id: MinigameDifficultyID;
        name: string;
        description: string;
        icon: AssetID;
        overwritingSettings: any;
    }[]
}

export type MinimizedMinigameInfoResponseDTO = {
    settings: any;
    overwritingSettings: any;
}

// "Known DTOs"
export type SessionInitiationRequestDTO = {
    userIdentifier: string;
    /**
     * Current Vitec Session Token
     */
    currentSessionToken: string;
    /**
     * Username
     */
    firstName: string;
    lastName: string;
}
export type SessionInitiationResponseDTO = {
    token: string;
    internalID: uint32;
}
export type TransformDTO = {
    xOffset: number;
    yOffset: number;
    zIndex: uint32;
    xScale: number;
    yScale: number;
}

export type CollectionEntryDTO = {
    transform: TransformDTO;
    graphicalAssetID: AssetID;
}
export enum AssetUseCase {
    ENVIRONMENT = 'environment',
    PLAYER = 'player',
    ICON = 'icon',
}
export enum ImageMIMEType {
    PNG = 'image/png',
    JPEG = 'image/jpeg',
    GIF = 'image/gif',
    SVG = 'image/svg+xml',
    BMP = 'image/bmp',
    WEBP = 'image/webp',
    TIFF = 'image/tiff',
    ICO = 'image/x-icon',
    UNKNOWN = 'unknown'
}
export type GraphicalAsset = {
    id: AssetID;
    useCase: AssetUseCase;
    type: ImageMIMEType;
    width: uint32;  
    height: uint32;
    alias: string;
}

export type MinimizedAssetDTO = {
    width: uint32;
    height: uint32;
    LODs: {
        detailLevel: uint32;
        id: AssetID;
    }[]
}

export type CreateColonyRequestDTO = {
    name: string;
}