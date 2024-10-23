import { Logger } from "../../logging/filteredLogger";
import { ResCodeErr } from "../../meta/types";
import { BackendIntegration, BaseBackendIntegration, URSA_HEADER_ASSET_ID, URSA_HEADER_DETAIL_LEVEL } from "./mainBackend";
import { AssetID, uint32 } from "./mainBackendDTOs"

export type ObjectURL = string & { release: () => void };

/**
 * Cache for object URLs. Counts how many times an object URL is taken and manages destruction internally.
 * 
 * REMEMBER TO RELEASE OBJECT URLS WHEN THEY ARE NO LONGER IN USE
 * Else we're going to get a memory leak.
 * 
 * @since 0.0.1
 * @author GustavBW
 */
export interface IObjectURLCache {
    get: (asset: AssetID, lodLevel: uint32) => Promise<ResCodeErr<ObjectURL>>;
    getByLODID: (lodID: uint32) => Promise<ResCodeErr<ObjectURL>>;
} 

type CacheEntry = {
    url: ObjectURL;
    retrievalCount: uint32;
    assetID: AssetID;
    lodLevel: uint32;
}

const generateCombinedKey = (asset: AssetID, lodLevel: uint32): string => `${asset}_${lodLevel}`;

export const initializeObjectURLCache = (backend: BackendIntegration, logger: Logger): IObjectURLCache => {
    const log = logger.copyFor('ourl cache');
    log.info('Initializing object URL cache');
    const byCombinedKey = new Map<string, CacheEntry>();
    const byLODID = new Map<uint32, CacheEntry>();

    const onUrlRelease = (key?: string, lodID?: uint32) => {
        if (!key && !lodID) {
            log.error(`onUrlRelease called without key or lodID`);
            return;
        }
        if (key) {
            const entry = byCombinedKey.get(key);
            if (entry) {
                entry.retrievalCount--;
                log.subtrace(`${key} released, count: ${entry.retrievalCount}`);
                if (entry.retrievalCount <= 0) {
                    log.subtrace(`${key} count reached 0, revoking URL`);
                    URL.revokeObjectURL(entry.url);
                    byCombinedKey.delete(key);
                }
            }
        }
        if (lodID) {
            const entry = byLODID.get(lodID);
            if (entry) {
                entry.retrievalCount--;
                log.subtrace(`LOD ${lodID} released, count: ${entry.retrievalCount}`);
                if (entry.retrievalCount <= 0) {
                    log.subtrace(`LOD ${lodID} count reached 0, revoking URL`);
                    URL.revokeObjectURL(entry.url);
                    byLODID.delete(lodID);
                }
            }
        }
    }

    const fetchAndStore = async (asset: AssetID, lodLevel: uint32): Promise<ResCodeErr<CacheEntry>> => {
        log.subtrace(`fetching: ${asset} at LOD ${lodLevel}`);
        const res = await backend.getLODByAsset(asset, lodLevel);
        if (res.err !== null) {
            log.warn(`failed to fetch: ${asset} at LOD ${lodLevel}: ${res.err}`);
            return res;
        }

        const blob = res.res;

        const key = generateCombinedKey(asset, lodLevel);
        const objectUrl = URL.createObjectURL(blob);
        const amalgamation = Object.assign(objectUrl, { release: () => onUrlRelease(key) });
        const cacheEntry = { url: amalgamation, retrievalCount: 0, assetID: asset, lodLevel};
        byCombinedKey.set(key, cacheEntry);
        return { res: cacheEntry, err: null, code: 200 };
    }

    const fetchAndStoreByLODID = async (lodID: uint32): Promise<ResCodeErr<CacheEntry>> => {
        log.subtrace(`fetching: LOD ${lodID}`);
        const res = await backend.getLOD(lodID);
        if (res.err !== null) {
            log.warn(`failed to fetch: LOD ${lodID}: ${res.err}`);
            return res;
        }

        const blob = res.res;
        const assetIDStr: string | null = blob.headers.get(URSA_HEADER_ASSET_ID);
        let assetID: AssetID = -1; //-1 is not a valid asset ID - not a valid uint32
        if (!assetIDStr || isNaN((assetID = parseInt(assetIDStr)))) {
            log.warn(`fetch error: LOD ${lodID}: ${URSA_HEADER_ASSET_ID} header faulty: ${assetIDStr}`);
        }

        const detailLevelStr: string | null = blob.headers.get(URSA_HEADER_DETAIL_LEVEL);
        let detailLevel: uint32 = -1; //-1 is not a valid detail level - not a valid uint32
        if (!detailLevelStr || isNaN((detailLevel = parseInt(detailLevelStr)))) {
            log.warn(`fetch error: LOD ${lodID}: ${URSA_HEADER_DETAIL_LEVEL} header faulty: ${detailLevelStr}`);
        }

        const objectUrl = URL.createObjectURL(blob);
        let key: string | undefined;
        if (assetID && detailLevel) {
            key = generateCombinedKey(assetID, detailLevel);
        }
        const amalgamation = Object.assign(objectUrl, { release: () => onUrlRelease(key, lodID) });
        const cacheEntry = { url: amalgamation, retrievalCount: 0, assetID, lodLevel: detailLevel };
        if (key) {
            byCombinedKey.set(key, cacheEntry);
        }
        byLODID.set(lodID, cacheEntry);
        return { res: cacheEntry, err: null, code: 200 };
    }

    const getByAsset = async (asset: AssetID, lodLevel: uint32): Promise<ResCodeErr<ObjectURL>> => {
        const key = generateCombinedKey(asset, lodLevel);
        const entry = byCombinedKey.get(key);
        if (entry) {
            entry.retrievalCount++;
            log.subtrace(`${key} retrieved from cache, count: ${entry.retrievalCount}`);
            return { res: entry.url, err: null, code: 200};
        }
        log.subtrace(`cache miss: ${key}`);
        const fetched = await fetchAndStore(asset, lodLevel);

        if (fetched.err !== null) {
            return fetched;
        }
        fetched.res.retrievalCount++;
        return { res: fetched.res.url, err: null, code: 200 };
    }

    const getByLODID = async (lodID: uint32): Promise<ResCodeErr<ObjectURL>> => {
        const entry = byLODID.get(lodID);
        if (entry) {
            entry.retrievalCount++;
            log.subtrace(`LOD ${lodID} retrieved from cache, count: ${entry.retrievalCount}`);
            return { res: entry.url, err: null, code: 200 };
        }
        log.subtrace(`cache miss: LOD ${lodID}`);
        const fetched = await fetchAndStoreByLODID(lodID);

        if (fetched.err !== null) {
            return fetched;
        }
        fetched.res.retrievalCount++;
        return { res: fetched.res.url, err: null, code: 200 };
    }

    return { get: getByAsset, getByLODID };
}