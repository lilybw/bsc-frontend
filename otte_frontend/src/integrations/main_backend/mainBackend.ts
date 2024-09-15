import { Logger } from "../../logging/filteredLogger";
import { ENV } from "../../environment/manager";
import { ParseMethod, ResErr } from "../../meta/types";

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export const USER_NOT_AUTHORIZED = 'User is not authorized yet'

let mainBackendRootUrl = 'http://invalid:invalid';



export type BackendIntegration = {
    /**
     * The request will be prefixed with the root url ("protocol://ip:port") of the main backend and
     * have the auth header set. Notably not including api versioning.
     * @param method The HTTP method to use
     * @param suburl The suburl to append to the main backend root url
     * @param retrieveAs The method to parse the response with. Defaults to JSON
     */
    request<T>(method: HTTPMethod, suburl: string, retrieveAs?: ParseMethod): Promise<ResErr<T>>;
}

export const initializeBackendIntegration = (environment: ENV, log: Logger): BackendIntegration => {
    const { mainBackendIP, mainBackendPort } = environment;
    mainBackendRootUrl = `http://${mainBackendIP}:${mainBackendPort}`;
    log.log(`Main backend root url: ${mainBackendRootUrl}`);
    return {
        request: <T>(method: HTTPMethod, suburl: string, retrieveAs: ParseMethod) => handleArbitraryRequest(log, method, suburl, retrieveAs)
    };
}

async function handleArbitraryRequest<T>(log: Logger, method: HTTPMethod, suburl: string, retrieveAs?: ParseMethod): Promise<ResErr<T>> {
    const parserType = retrieveAs ?? ParseMethod.JSON;
    const userToken = localStorage.getItem('URSA-Token');
    const headers: HeadersInit = {
        'Origin': 'URSA-Frontend',
        'URSA-Token': userToken || ''
    };
    if ((!userToken || userToken === '' || userToken === null) && !suburl.includes('session')) {
        log.log('User is not authorized yet a request for: ' + suburl + " was made");
        return { err: USER_NOT_AUTHORIZED };
    }
    try {
        const response = await fetch(suburl, {
            method: method,
            headers: headers
        });
        if (response.headers.get('Ursa-Ddh') != null) {
            log.warn('DDH: ' + response.headers.get('Ursa-Ddh'));
        }
        const code = response.status;
        if (!(code >= 200 && code < 300)) {
            //It just so happens that the backend will give error messages a strings in the body most of the time
            //If not, it shouldn't fail trying to retrieve the body as text
            log.error(`${suburl} ${code} ${response.statusText} \n${await response.text()}`);
            return { err: `${code} ${response.statusText}` };
        }

        switch (parserType) {
            case ParseMethod.JSON:
                return { res: await response.json() as T };
            case ParseMethod.TEXT:
                return { res: await response.text() as unknown as T };
            case ParseMethod.BLOB:
                return { res: await response.blob() as unknown as T };
            case ParseMethod.ARRAYBUFFER:
                return { res: await response.arrayBuffer() as unknown as T };
            case ParseMethod.NONE:
                return { res: undefined as unknown as T };
        }
        
    } catch (error) {
        console.error('Error:', error);
        return { err: error as string };
    }
}