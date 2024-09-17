import { Logger } from "../../logging/filteredLogger";
import { ENV } from "../../environment/manager";
import { ParseMethod, ResCodeErr, ResErr, ResErrSet } from "../../meta/types";
import { SessionInitiationRequestDTO, SessionInitiationResponseDTO } from "./mainBackendDTOs";

export enum HTTPMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}
export const USER_NOT_AUTHORIZED_ERROR = 'User is not authorized yet'
export const NO_BACKEND_CONNECTION_ERROR = 'No connection to backend'
export const BACKEND_INTERNAL_ERROR = 'Backend internal error'

export type BackendIntegration = {
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
    request<T>(method: HTTPMethod, suburl: string, retrieveAs?: ParseMethod): Promise<ResCodeErr<T>>;
}

export async function initializeBackendIntegration(environment: ENV, log: Logger, userData: SessionInitiationRequestDTO): Promise<ResErr<BackendIntegration>> {
    const { mainBackendIP, mainBackendPort } = environment;
    let mainBackendRootUrl = `https://${mainBackendIP}:${mainBackendPort}`;
    if (environment.proxyMainBackendRequests) {
        log.log('Proxying main backend requests');
        mainBackendRootUrl = '/backend';
    }
    log.log(`Main backend root url: ${mainBackendRootUrl}`);
    const integration: BackendIntegration = {
        mainBackendRootUrl,
        userToken: undefined,
        request: undefined as any,
        authHeaderName: environment.authHeaderName,
        logger: log
    };
    const tokenRes = await beginSession(integration, userData);
    if (tokenRes.err != null) {
        return { res: null, err: tokenRes.err };
    }

    integration.userToken = tokenRes.res;
    integration.request = <T>(method: HTTPMethod, suburl: string, retrieveAs: ParseMethod) => handleArbitraryRequest(integration, method, suburl, retrieveAs)

    return {res: integration, err: null};
}

async function handleArbitraryRequest<T>(integration: BackendIntegration, method: HTTPMethod, suburl: string, retrieveAs?: ParseMethod): Promise<ResCodeErr<T>> {
    const parserType = retrieveAs ?? ParseMethod.JSON;
    const userToken = integration.userToken;
    const headers: HeadersInit = {
        'Origin': 'URSA-Frontend',
    };
    headers[integration.authHeaderName] = userToken ?? '';
    
    if ((!userToken || userToken === '' || userToken === null) && !suburl.includes('session')) {
        integration.logger.log('User is not authorized yet a request for: ' + suburl + " was made");
        return { res: null, code: 400, err: USER_NOT_AUTHORIZED_ERROR };
    }
    try {
        const response = await fetch(integration.mainBackendRootUrl + suburl, {
            method: method,
            headers: headers
        });
        const ddh = response.headers.get('Ursa-Ddh');
        if (ddh != null) {
            integration.logger.warn('DDH: ' + ddh);
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
        integration.logger.error('Error: ' + error as string);
        return { res: null, code: 600, err: error as string };
    }
}

async function beginSession(integration: BackendIntegration, data: SessionInitiationRequestDTO): Promise<ResErr<string>> {
    const response = await handleArbitraryRequest<SessionInitiationResponseDTO>(
        integration, HTTPMethod.POST, '/api/v1/session', ParseMethod.JSON
    );
    //Falsy values, undefined, 0, '', NaN, false
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
    return { res: response.res.token, err: null };
} 