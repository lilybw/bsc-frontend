import { Logger } from '../../logging/filteredLogger';
import { ENV } from '../../environment/manager';
import { type Error, ParseMethod, ResCodeErr, ResErr, RuntimeMode } from '../../meta/types';
import {
    AssetCollectionID,
    AssetCollectionResponseDTO,
    AssetID,
    AssetResponseDTO,
    AvailableLanguagesResponseDTO,
    ColonyCode,
    ColonyInfoResponseDTO,
    ColonyOverviewReponseDTO,
    ColonyPathGraphResponseDTO,
    CreateColonyRequestDTO,
    CreateColonyResponseDTO,
    InternationalizationCatalogueResponseDTO,
    JoinColonyResponseDTO,
    LocationInfoFullResponseDTO,
    LocationInfoResponseDTO,
    LODID,
    MBHealthCheckResponseDTO,
    MinigameDifficultyID,
    MinigameID,
    MinigameInfoResponseDTO,
    MinimizedMinigameInfoResponseDTO,
    OpenColonyRequestDTO,
    OpenColonyResponseDTO,
    CloseColonyRequestDTO,
    PlayerID,
    PlayerInfoResponseDTO,
    PlayerPreferencesResponseDTO,
    PreferenceKeys,
    ResponseBlob,
    SessionInitiationRequestDTO,
    SessionInitiationResponseDTO,
    UpdateLatestVisitRequestDTO,
    UpdateLatestVisitResponseDTO,
    GetColonyCodeResponseDTO,
    uint32,
} from './mainBackendDTOs';
import { LanguagePreference } from '../vitec/vitecDTOs';
import { initializeObjectURLCache, IObjectURLCache } from './objectUrlCache';
import { LobbyStateResponseDTO } from '../multiplayer_backend/multiplayerDTO';
/**
 * @since 0.0.1
 * @author GustavBW
 */
export enum HTTPMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}
export const USER_NOT_AUTHORIZED_ERROR = 'User is not authorized yet';
export const NO_BACKEND_CONNECTION_ERROR = 'No connection to backend';
export const BACKEND_INTERNAL_ERROR = 'Backend internal error';
/**
 * @since 0.0.1
 * @author GustavBW
 */
export type BaseBackendIntegration = {
    mainBackendRootUrl: string;
    userToken?: string;
    authHeaderName: string;
    logger: Logger;

    /**
     * The request will be prefixed with the root url ("protocol://ip:port") of the main backend and
     * have the auth header set. Notably not including api versioning.
     *
     * Returns 600 if request failed unexpectedly on the frontend side of things
     *
     * @param method The HTTP method to use
     * @param suburl The suburl to append to the main backend root url
     * @param retrieveAs The method to parse the response with. Defaults to JSON
     */
    request<T>(method: HTTPMethod, suburl: string, retrieveAs?: ParseMethod, body?: object): Promise<ResCodeErr<T>>;
};

/**
 * @since 0.0.1
 * @author GustavBW
 */
export interface BackendIntegration extends BaseBackendIntegration {
    healthCheck: () => Promise<ResCodeErr<MBHealthCheckResponseDTO>>;

    player: {
        local: PlayerInfoResponseDTO;
        getInfo: (player: PlayerID) => Promise<ResCodeErr<PlayerInfoResponseDTO>>;
        getPreferences: (player: PlayerID) => Promise<ResCodeErr<PlayerPreferencesResponseDTO>>;
        setPreference: (key: PreferenceKeys, value: string) => Promise<ResCodeErr<void>>;
        grantAchievement: (achievement: number) => Promise<ResCodeErr<void>>;
    };

    getCatalogue: (locale: LanguagePreference) => Promise<ResCodeErr<InternationalizationCatalogueResponseDTO>>;
    getAvailableLanguages: () => Promise<ResCodeErr<AvailableLanguagesResponseDTO>>;

    colony: {
        get: (player: PlayerID, colony: number) => Promise<ResCodeErr<ColonyInfoResponseDTO>>;
        updateLatestVisit: (dto: UpdateLatestVisitRequestDTO, colony: number) => Promise<ResCodeErr<UpdateLatestVisitResponseDTO>>;
        getOverview: (player: PlayerID) => Promise<ResCodeErr<ColonyOverviewReponseDTO>>;
        open: (colony: number, dto: OpenColonyRequestDTO) => Promise<ResCodeErr<OpenColonyResponseDTO>>;
        getCode: (colony: number) => Promise<ResCodeErr<GetColonyCodeResponseDTO>>;
        close: (colony: number, dto: CloseColonyRequestDTO) => Promise<ResCodeErr<void>>;
        join: (code: ColonyCode) => Promise<ResCodeErr<JoinColonyResponseDTO>>;
        create: (dto: CreateColonyRequestDTO, player: PlayerID) => Promise<ResCodeErr<CreateColonyResponseDTO>>;
        getPathGraph: (colony: uint32) => Promise<ResCodeErr<ColonyPathGraphResponseDTO>>;
    };

    locations: {
        getInfo: (location: uint32) => Promise<ResCodeErr<LocationInfoResponseDTO>>;
        getFullInfo: (location: uint32) => Promise<ResCodeErr<LocationInfoFullResponseDTO>>;
    };

    assets: {
        getMetadata: (asset: AssetID) => Promise<ResCodeErr<AssetResponseDTO>>;
        getMetadataOfMultiple: (assets: AssetID[]) => Promise<ResCodeErr<AssetResponseDTO[]>>;
        getAssetLOD: (asset: AssetID, detailLevel: number) => Promise<ResCodeErr<ResponseBlob>>;
        getLOD: (lod: LODID) => Promise<ResCodeErr<ResponseBlob>>;
        getCollection: (collection: AssetCollectionID) => Promise<ResCodeErr<AssetCollectionResponseDTO>>;
    };
    objectUrlCache: IObjectURLCache;

    minigame: {
        getInfo: (minigame: uint32) => Promise<ResCodeErr<MinigameInfoResponseDTO>>;
        getMinimizedInfo: (minigame: MinigameID, diffulty: MinigameDifficultyID) => Promise<ResCodeErr<MinimizedMinigameInfoResponseDTO>>;
    };

    /**
     * Some calls are proxied through the main backend for a number of reasons.
     * Most of them being the browser's pre-flight checks which prevents non-TLS and self-signed TLS connections.
     */
    proxy: {
        multiplayer: {
            getLobbyState: (lobbyID: uint32) => Promise<ResCodeErr<LobbyStateResponseDTO>>;
        };
    };
}

/**
 * In raw binary responses (blob), further information about the asset is provided in the headers.
 */
export const URSA_HEADER_DETAIL_LEVEL = 'URSA-DETAIL-LEVEL';
/**
 * In raw binary responses (blob), further information about the asset is provided in the headers.
 */
export const URSA_HEADER_ASSET_ID = 'URSA-ASSET-ID';

/**
 * @since 0.0.1
 * @author GustavBW
 */
export async function initializeBackendIntegration(
    environment: ENV,
    logger: Logger,
    userData: SessionInitiationRequestDTO,
): Promise<ResErr<BackendIntegration>> {
    const log = logger.copyFor('umb int');
    log.trace('Initializing backend integration');
    const { mainBackendIP, mainBackendPort } = environment;
    let mainBackendRootUrl = `https://${mainBackendIP}:${mainBackendPort}`;
    if (environment.proxyMainBackendRequests) {
        log.info('Proxying main backend requests');

        if (mainBackendRootUrl === undefined || mainBackendRootUrl === null) {
            log.error('  Proxying main backend requests is enabled, but no proxy url is provided');
            return { res: null, err: 'Proxying main backend requests is enabled, but no proxy url is provided' };
        }

        mainBackendRootUrl = environment.mainBackendURLWhenProxied!;
    }
    log.info(`Main backend root url: ${mainBackendRootUrl}`);
    const placeholder = () => {
        throw new Error('backend integration not initialized');
    };
    const base: BaseBackendIntegration = {
        mainBackendRootUrl,
        authHeaderName: environment.authHeaderName,
        userToken: undefined,
        logger: log,
        request: placeholder,
    };
    base.request = <T>(method: HTTPMethod, suburl: string, retrieveAs: ParseMethod, body?: object) =>
        handleArbitraryRequest(base, method, suburl, retrieveAs, body);

    const tokenRes = await beginSession(base, userData, environment);
    if (tokenRes.err != null) {
        return { res: null, err: tokenRes.err };
    }
    base.userToken = tokenRes.res.token;

    const playerInfoRes = await base.request<PlayerInfoResponseDTO>(HTTPMethod.GET, `/api/v1/player/${tokenRes.res.internalID}`, ParseMethod.JSON);
    if (playerInfoRes.err != null) {
        return { res: null, err: playerInfoRes.err };
    }
    const integration = applyRouteImplementations(base, playerInfoRes.res);
    integration.objectUrlCache = initializeObjectURLCache(integration, log);

    log.trace('Backend integration initialized');
    return { res: integration, err: null };
}
/**
 * @since 0.0.1
 * @author GustavBW
 */
const applyRouteImplementations = (base: BaseBackendIntegration, localPlayer: PlayerInfoResponseDTO): BackendIntegration => {
    return {
        ...base,
        healthCheck: () => base.request<MBHealthCheckResponseDTO>(HTTPMethod.GET, '/api/v1/health', ParseMethod.JSON),
        player: {
            local: localPlayer,
            getInfo: (player) => base.request<PlayerInfoResponseDTO>(HTTPMethod.GET, `/api/v1/player/${player}`, ParseMethod.JSON),
            getPreferences: (player) =>
                base.request<PlayerPreferencesResponseDTO>(HTTPMethod.GET, `/api/v1/player/${player}/preferences`, ParseMethod.JSON),
            setPreference: (key, value) =>
                base.request<void>(HTTPMethod.POST, `/api/v1/player/${localPlayer.id}/preferences`, ParseMethod.NONE, { key, value }),
            grantAchievement: (achievement) =>
                base.request<void>(HTTPMethod.POST, `/api/v1/player/${localPlayer.id}/achievement/${achievement}`, ParseMethod.NONE),
        },

        getCatalogue: (locale) =>
            base.request<InternationalizationCatalogueResponseDTO>(HTTPMethod.GET, `/api/v1/catalog/${locale}`, ParseMethod.JSON),
        getAvailableLanguages: () => base.request<AvailableLanguagesResponseDTO>(HTTPMethod.GET, `/api/v1/catalog/languages`, ParseMethod.JSON),

        colony: {
            get: (player, colony) =>
                base.request<ColonyInfoResponseDTO>(HTTPMethod.GET, `/api/v1/player/${player}/colony/${colony}`, ParseMethod.JSON),
            updateLatestVisit: (dto, colony) =>
                base.request<UpdateLatestVisitResponseDTO>(HTTPMethod.POST, `/api/v1/colony/${colony}/update-last-visit`, ParseMethod.JSON, dto),
            getOverview: (player) => base.request<ColonyOverviewReponseDTO>(HTTPMethod.GET, `/api/v1/player/${player}/colonies`, ParseMethod.JSON),
            open: (colony, dto) => base.request<OpenColonyResponseDTO>(HTTPMethod.POST, `/api/v1/colony/${colony}/open`, ParseMethod.JSON, dto),
            getCode: (colony) => base.request<GetColonyCodeResponseDTO>(HTTPMethod.GET, `/api/v1/colony/${colony}/code`, ParseMethod.JSON),
            close: (colony, dto) => base.request<void>(HTTPMethod.POST, `/api/v1/colony/${colony}/close`, ParseMethod.NONE, dto),
            join: (code) => base.request<JoinColonyResponseDTO>(HTTPMethod.POST, `/api/v1/colony/join/${code}`, ParseMethod.JSON),
            create: (dto, player) =>
                base.request<ColonyInfoResponseDTO>(HTTPMethod.POST, `/api/v1/player/${player}/colony/create`, ParseMethod.JSON, dto),
            getPathGraph: (colony) =>
                base.request<ColonyPathGraphResponseDTO>(HTTPMethod.GET, `/api/v1/colony/${colony}/pathgraph`, ParseMethod.JSON),
        },
        locations: {
            getInfo: (location) => base.request<LocationInfoResponseDTO>(HTTPMethod.GET, `/api/v1/location/${location}`, ParseMethod.JSON),
            getFullInfo: (location) =>
                base.request<LocationInfoFullResponseDTO>(HTTPMethod.GET, `/api/v1/location/${location}/full`, ParseMethod.JSON),
        },
        assets: {
            getMetadata: (assetId) => base.request<AssetResponseDTO>(HTTPMethod.GET, `/api/v1/asset/${assetId}`, ParseMethod.JSON),
            getMetadataOfMultiple: (assets) =>
                base.request<AssetResponseDTO[]>(HTTPMethod.GET, `/api/v1/assets?ids=${assets.join(',')}`, ParseMethod.JSON),
            getAssetLOD: (asset, lod) => base.request<ResponseBlob>(HTTPMethod.GET, `/api/v1/asset/${asset}/lod/${lod}`, ParseMethod.BLOB),
            getLOD: (lod: LODID) => base.request<ResponseBlob>(HTTPMethod.GET, `/api/v1/lod/${lod}`, ParseMethod.BLOB),
            getCollection: (collection) =>
                base.request<AssetCollectionResponseDTO>(HTTPMethod.GET, `/api/v1/collection/${collection}`, ParseMethod.JSON),
        },
        objectUrlCache: null as any, //Field initialized in initializeBackendIntegration
        minigame: {
            getInfo: (minigame) => base.request<MinigameInfoResponseDTO>(HTTPMethod.GET, `/api/v1/minigame/${minigame}`, ParseMethod.JSON),
            getMinimizedInfo: (minigame, difficulty) =>
                base.request<MinimizedMinigameInfoResponseDTO>(
                    HTTPMethod.GET,
                    `/api/v1/minigame/minimized?minigame=${minigame}&difficulty=${difficulty}`,
                    ParseMethod.JSON,
                ),
        },

        proxy: {
            multiplayer: {
                getLobbyState: (lobbyID) =>
                    base.request<LobbyStateResponseDTO>(HTTPMethod.GET, `/proxy/v1/multiplayer/lobby/${lobbyID}`, ParseMethod.JSON),
            },
        },
    };
};
/**
 * @since 0.0.1
 * @author GustavBW
 */
async function handleArbitraryRequest<T>(
    integration: BaseBackendIntegration,
    method: HTTPMethod,
    suburl: string,
    retrieveAs?: ParseMethod,
    body?: any,
): Promise<ResCodeErr<T>> {
    const parserType = retrieveAs ?? ParseMethod.JSON;
    const userToken = integration.userToken;
    const headers: HeadersInit = {
        Origin: 'URSA-Frontend',
    };
    headers[integration.authHeaderName] = userToken ?? '';
    headers['Content-Type'] = 'application/json';

    if ((!userToken || userToken === '' || userToken === null) && !suburl.includes('session')) {
        integration.logger.warn('User is not yet authorized, yet a request for: ' + suburl + ' was made');
        return { res: null, code: 400, err: USER_NOT_AUTHORIZED_ERROR };
    }
    try {
        integration.logger.subtrace(`OUT: ${method} ${integration.mainBackendRootUrl}${suburl}`);
        const response = await fetch(integration.mainBackendRootUrl + suburl, {
            method: method,
            body: body ? JSON.stringify(body) : undefined,
            headers: headers,
        });
        const ddh = response.headers.get('Ursa-Ddh');
        if (ddh != null) {
            integration.logger.info('DDH: ' + ddh);
        }
        const code = response.status;
        if (!(code >= 200 && code < 300)) {
            //It just so happens that the backend will give error messages a strings in the body most of the time
            //If not, it shouldn't fail trying to retrieve the body as text
            integration.logger.error(`${suburl} ${code} ${response.statusText} \n${await response.text()}`);
            return { res: null, code: code, err: `${code} ${response.statusText}` };
        }

        switch (parserType) {
            case ParseMethod.JSON:
                return { res: (await response.json()) as T, code: code, err: null };
            case ParseMethod.TEXT:
                return { res: (await response.text()) as unknown as T, code: code, err: null };
            case ParseMethod.BLOB:
                const blob = await response.blob();
                const amalgamation = Object.assign(blob, { headers: response.headers });
                return { res: amalgamation as unknown as T, code: code, err: null };
            case ParseMethod.ARRAYBUFFER:
                return { res: (await response.arrayBuffer()) as unknown as T, code: code, err: null };
            case ParseMethod.NONE:
                return { res: undefined as unknown as T, code: code, err: null };
        }
    } catch (error) {
        integration.logger.error(error as Error);
        return { res: null, code: 600, err: error as Error };
    }
}
/**
 * @since 0.0.1
 * @author GustavBW
 */
async function beginSession(
    base: BaseBackendIntegration,
    data: SessionInitiationRequestDTO,
    enviroment: ENV,
): Promise<ResErr<SessionInitiationResponseDTO>> {
    if (enviroment.runtimeMode !== RuntimeMode.PRODUCTION) {
        if (!data.firstName || data.firstName === '') {
            base.logger.warn('[begin session] Missing first name: ' + data.firstName);
            data.firstName = 'Tav';
        }
        if (!data.lastName || data.lastName === '') {
            base.logger.warn('[begin session] Missing last name: ' + data.lastName);
            data.lastName = 'McTavsen';
        }
        if (!data.userIdentifier || data.userIdentifier === '') {
            base.logger.warn('[begin session] Missing user identifier: ' + data.userIdentifier);
            data.userIdentifier = 'MISSING_IDENTIFIER';
        }
    }
    const response = await handleArbitraryRequest<SessionInitiationResponseDTO>(base, HTTPMethod.POST, '/api/v1/session', ParseMethod.JSON, data);
    if (response.err != null) {
        if (response.code === 401) {
            return { res: null, err: USER_NOT_AUTHORIZED_ERROR };
        }
        if (response.code === 404) {
            return { res: null, err: NO_BACKEND_CONNECTION_ERROR };
        }
        if (response.code === 500) {
            return { res: null, err: BACKEND_INTERNAL_ERROR };
        }
        return { res: null, err: response.err };
    }
    return { res: response.res, err: null };
}
