import { Logger } from "../../logging/filteredLogger";
import { ENV } from "../../environment/manager";
import { ParseMethod, ResCodeErr, ResErr, RuntimeMode } from "../../meta/types";
import { 
    AssetCollectionID, AssetCollectionResponseDTO, AssetID, 
    AssetResponseDTO, AvailableLanguagesResponseDTO, ColonyCode, ColonyInfoResponseDTO, 
    ColonyOverviewReponseDTO, 
    ColonyPathGraphResponseDTO, 
    CreateColonyRequestDTO, InternationalizationCatalogueResponseDTO, 
    JoinColonyResponseDTO, 
    LocationInfoFullResponseDTO, LocationInfoResponseDTO, 
    MinigameDifficultyID, MinigameID, MinigameInfoResponseDTO, 
    OpenColonyRequestDTO, 
    OpenColonyResponseDTO, PlayerID, PlayerInfoResponseDTO, 
    PlayerPreferencesResponseDTO, PreferenceKeys, SessionInitiationRequestDTO, 
    SessionInitiationResponseDTO, UpdateLatestVisitRequestDTO, UpdateLatestVisitResponseDTO
} from "./mainBackendDTOs";
import { LanguagePreference } from "../vitec/vitecDTOs";
/**
 * @since 0.0.1
 * @author GustavBW
 */
export enum HTTPMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}
export const USER_NOT_AUTHORIZED_ERROR = 'User is not authorized yet'
export const NO_BACKEND_CONNECTION_ERROR = 'No connection to backend'
export const BACKEND_INTERNAL_ERROR = 'Backend internal error'
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
}

/**
 * @since 0.0.1
 * @author GustavBW
 */
export interface BackendIntegration extends BaseBackendIntegration {
    localPlayer: PlayerInfoResponseDTO;
    getPlayerInfo:          (player: PlayerID) => Promise<ResCodeErr<PlayerInfoResponseDTO>>;
    getPlayerPreferences:   (player: PlayerID) => Promise<ResCodeErr<PlayerPreferencesResponseDTO>>;
    setPlayerPreference:    (key: PreferenceKeys, value: string) => Promise<ResCodeErr<void>>;
    grantAchievement:       (achievement: number) => Promise<ResCodeErr<void>>;

    getCatalogue:           (locale: LanguagePreference) => Promise<ResCodeErr<InternationalizationCatalogueResponseDTO>>;
    getAvailableLanguages:  () => Promise<ResCodeErr<AvailableLanguagesResponseDTO>>;

    getColony:              (player: PlayerID, colony: number) => Promise<ResCodeErr<ColonyInfoResponseDTO>>;
    updateLatestVisit:      (dto: UpdateLatestVisitRequestDTO, colony: number) => Promise<ResCodeErr<UpdateLatestVisitResponseDTO>>;
    getColonyOverview:      (player: PlayerID) => Promise<ResCodeErr<ColonyOverviewReponseDTO>>;
    openColony:             (colony: number, dto: OpenColonyRequestDTO) => Promise<ResCodeErr<OpenColonyResponseDTO>>;
    joinColony:             (code: ColonyCode) => Promise<ResCodeErr<JoinColonyResponseDTO>>;
    createColony:           (dto: CreateColonyRequestDTO, player: PlayerID) => Promise<ResCodeErr<ColonyInfoResponseDTO>>;
    getColonyPathGraph:     (colony: number) => Promise<ResCodeErr<ColonyPathGraphResponseDTO>>

    getLocationInfo:        (location: number) => Promise<ResCodeErr<LocationInfoResponseDTO>>;
    getFullLocationInfo:    (location: number) => Promise<ResCodeErr<LocationInfoFullResponseDTO>>;

    getAssetMetadata:       (asset: AssetID) => Promise<ResCodeErr<AssetResponseDTO>>;
    getMetadataOfAssets:    (assets: AssetID[]) => Promise<ResCodeErr<AssetResponseDTO[]>>;
    getAssetLOD:            (asset: AssetID, lod: number) => Promise<ResCodeErr<Blob>>;
    getAssetCollection:     (collection: AssetCollectionID) => Promise<ResCodeErr<AssetCollectionResponseDTO[]>>;

    getMinigameInfo:        (minigame: number) => Promise<ResCodeErr<MinigameInfoResponseDTO>>;
    getMinimizedMinigameInfo: (minigame: MinigameID, diffulty: MinigameDifficultyID) => Promise<ResCodeErr<MinigameInfoResponseDTO>>;
}
/**
 * @since 0.0.1
 * @author GustavBW
 */
export async function initializeBackendIntegration(environment: ENV, log: Logger, userData: SessionInitiationRequestDTO): Promise<ResErr<BackendIntegration>> {
    log.trace('[umb int] Initializing backend integration');
    const { mainBackendIP, mainBackendPort } = environment;
    let mainBackendRootUrl = `https://${mainBackendIP}:${mainBackendPort}`;
    if (environment.proxyMainBackendRequests) {
        log.log('[umb int] Proxying main backend requests');

        if (mainBackendRootUrl === undefined || mainBackendRootUrl === null) {
            log.error('[umb int] Proxying main backend requests is enabled, but no proxy url is provided');
            return { res: null, err: 'Proxying main backend requests is enabled, but no proxy url is provided' };
        }

        mainBackendRootUrl = environment.mainBackendURLWhenProxied!;
    }
    log.log(`[umb int] Main backend root url: ${mainBackendRootUrl}`);
    const placeholder = () => { throw new Error('backend integration not initialized') };
    const base: BaseBackendIntegration = {
        mainBackendRootUrl,
        authHeaderName: environment.authHeaderName,
        userToken: undefined,
        logger: log,
        request: placeholder
    }
    base.request = <T>(method: HTTPMethod, suburl: string, retrieveAs: ParseMethod, body?: object) => handleArbitraryRequest(base, method, suburl, retrieveAs, body);
    
    const tokenRes = await beginSession(base, userData, environment);
    if (tokenRes.err != null) {
        return { res: null, err: tokenRes.err };
    }
    base.userToken = tokenRes.res.token;

    const playerInfoRes = await base.request<PlayerInfoResponseDTO>(
        HTTPMethod.GET, `/api/v1/player/${tokenRes.res.internalID}`, ParseMethod.JSON
    ); if (playerInfoRes.err != null) {
        return { res: null, err: playerInfoRes.err };
    }
    const integration = applyRouteImplementations(base, playerInfoRes.res);

    log.trace('[umb int] Backend integration initialized');
    return {res: integration, err: null};
}
/**
 * @since 0.0.1
 * @author GustavBW
 */
const applyRouteImplementations = (base: BaseBackendIntegration, localPlayer: PlayerInfoResponseDTO): BackendIntegration => {
    return {
        ...base, 
        localPlayer: localPlayer,
        getPlayerInfo:      (player) => base.request<PlayerInfoResponseDTO>(
            HTTPMethod.GET, `/api/v1/player/${player}`, ParseMethod.JSON),
        getPlayerPreferences: (player) => base.request<PlayerPreferencesResponseDTO>(
            HTTPMethod.GET, `/api/v1/player/${player}/preferences`, ParseMethod.JSON),
        setPlayerPreference: (key, value) => base.request<void>(
            HTTPMethod.POST, `/api/v1/player/${localPlayer.id}/preferences`, ParseMethod.NONE, { key, value }
        ),
        grantAchievement: (achievement) => base.request<void>(
            HTTPMethod.POST, `/api/v1/player/${localPlayer.id}/achievement/${achievement}`, ParseMethod.NONE
        ),

        getCatalogue:       (locale) => base.request<InternationalizationCatalogueResponseDTO>(
            HTTPMethod.GET, `/api/v1/catalog/${locale}`, ParseMethod.JSON),
        getAvailableLanguages: () => base.request<AvailableLanguagesResponseDTO>(
            HTTPMethod.GET, `/api/v1/catalog/languages`, ParseMethod.JSON),
       
        getColony:          (player, colony) => base.request<ColonyInfoResponseDTO>(
            HTTPMethod.GET, `/api/v1/player/${player}/colony/${colony}`, ParseMethod.JSON),
        updateLatestVisit: (dto, colony) => base.request<UpdateLatestVisitResponseDTO>(
            HTTPMethod.POST, `/api/v1/colony/${colony}/update-last-visit`, ParseMethod.JSON, dto),
        getColonyOverview:  (player) => base.request<ColonyOverviewReponseDTO>(
            HTTPMethod.GET, `/api/v1/player/${player}/colonies`, ParseMethod.JSON),
        openColony:         (colony, dto) => base.request<OpenColonyResponseDTO>(
            HTTPMethod.POST, `/api/v1/colony/${colony}/open`, ParseMethod.JSON, dto),
        joinColony:         (code) => base.request<JoinColonyResponseDTO>(
            HTTPMethod.POST, `/api/v1/colony/join/${code}`, ParseMethod.JSON),
        createColony: (dto, player) => base.request<ColonyInfoResponseDTO>(
            HTTPMethod.POST, `/api/v1/player/${player}/colony/create`, ParseMethod.JSON, dto),
        getColonyPathGraph: (colony) => base.request<ColonyPathGraphResponseDTO>(
            HTTPMethod.GET, `/api/v1/colony/${colony}/pathgraph`, ParseMethod.JSON),

        getLocationInfo:     (location) => base.request<LocationInfoResponseDTO>(
            HTTPMethod.GET, `/api/v1/location/${location}`, ParseMethod.JSON),
        getFullLocationInfo: (location) => base.request<LocationInfoFullResponseDTO>(
            HTTPMethod.GET, `/api/v1/location/${location}/full`, ParseMethod.JSON),

        getAssetMetadata:   (assetId) => base.request<AssetResponseDTO>(
            HTTPMethod.GET, `/api/v1/asset/${assetId}`, ParseMethod.JSON),
        getMetadataOfAssets:(assets) => base.request<AssetResponseDTO[]>(
            HTTPMethod.GET, `/api/v1/assets?ids=${assets.join(",")}`, ParseMethod.JSON),
        getAssetLOD:        (asset, lod) => base.request<Blob>(
            HTTPMethod.GET, `/api/v1/asset/${asset}/lod/${lod}`, ParseMethod.BLOB),
        getAssetCollection: (collection) => base.request<AssetCollectionResponseDTO[]>(
            HTTPMethod.GET, `/api/v1/collection/${collection}`, ParseMethod.JSON),

        getMinigameInfo:    (minigame) => base.request<MinigameInfoResponseDTO>(
            HTTPMethod.GET, `/api/v1/minigame/${minigame}`, ParseMethod.JSON),
        getMinimizedMinigameInfo: (minigame, difficulty) => base.request<MinigameInfoResponseDTO>(
            HTTPMethod.GET, `/api/v1/minigame/minimized?minigame=${minigame}&difficulty=${difficulty}`, ParseMethod.JSON),
    }
}
/**
 * @since 0.0.1
 * @author GustavBW
 */
async function handleArbitraryRequest<T>(integration: BaseBackendIntegration, method: HTTPMethod, suburl: string, retrieveAs?: ParseMethod, body?: any): Promise<ResCodeErr<T>> {
    const parserType = retrieveAs ?? ParseMethod.JSON;
    const userToken = integration.userToken;
    const headers: HeadersInit = {
        'Origin': 'URSA-Frontend',
    };
    headers[integration.authHeaderName] = userToken ?? '';
    headers['Content-Type'] = 'application/json';
    
    if ((!userToken || userToken === '' || userToken === null) && !suburl.includes('session')) {
        integration.logger.log('[umb int] User is not authorized, yet a request for: ' + suburl + " was made");
        return { res: null, code: 400, err: USER_NOT_AUTHORIZED_ERROR };
    }
    try {
        integration.logger.trace(`[umb int] OUT: ${method} ${integration.mainBackendRootUrl}${suburl}`);
        const response = await fetch(integration.mainBackendRootUrl + suburl, {
            method: method,
            body: body ? JSON.stringify(body) : undefined,
            headers: headers
        });
        const ddh = response.headers.get('Ursa-Ddh');
        if (ddh != null) {
            integration.logger.warn('[umb int] DDH: ' + ddh);
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
                return { res: await response.json() as T, code: code, err: null };
            case ParseMethod.TEXT:
                return { res: await response.text() as unknown as T, code: code, err: null };
            case ParseMethod.BLOB:
                return { res: await response.blob() as unknown as T, code: code, err: null };
            case ParseMethod.ARRAYBUFFER:
                return { res: await response.arrayBuffer() as unknown as T, code: code, err: null };
            case ParseMethod.NONE:
                return { res: undefined as unknown as T, code: code, err: null };
        }
        
    } catch (error) {
        integration.logger.error('[umb int] Error: ' + error as string);
        return { res: null, code: 600, err: error as string };
    }
}
/**
 * @since 0.0.1
 * @author GustavBW
 */
async function beginSession(base: BaseBackendIntegration, data: SessionInitiationRequestDTO, enviroment: ENV): Promise<ResErr<SessionInitiationResponseDTO>> {
    if (enviroment.runtimeMode !== RuntimeMode.PRODUCTION) {
        if (!data.firstName || data.firstName === "") {
            base.logger.trace("[begin session] Missing first name: " + data.firstName);
            data.firstName = "Tav"
        }
        if (!data.lastName || data.lastName === "") {
            base.logger.trace("[begin session] Missing last name: " + data.lastName);
            data.lastName = "McTavsen"
        }
        if (!data.userIdentifier || data.userIdentifier === "") {
            base.logger.trace("[begin session] Missing user identifier: " + data.userIdentifier);
            data.userIdentifier = "MISSING_IDENTIFIER"
        }
    }
    const response = await handleArbitraryRequest<SessionInitiationResponseDTO>(
        base, HTTPMethod.POST, '/api/v1/session', ParseMethod.JSON, data
    );
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