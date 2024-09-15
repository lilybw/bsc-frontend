import { ResErr } from "../meta/types";

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export const USER_NOT_AUTHORIZED = 'User is not authorized yet'

const mainBackendRootUrl = 'http://localhost:8080';

export async function handleRequest<T>(method: HTTPMethod, suburl: string): Promise<ResErr<T>> {
    const userToken = localStorage.getItem('URSA-Token');
    const headers: HeadersInit = {
        'Origin': 'URSA-Frontend',
        'URSA-Token': userToken || ''
    };
    if ((!userToken || userToken === '' || userToken === null) && !suburl.includes('session')) {
        return { err: USER_NOT_AUTHORIZED };
    }
    try {
        const response = await fetch(suburl, {
            method: method,
            headers: headers
        });
        if (response.headers.get('Ursa-Ddh') != null) {
            console.warn('DDH: ' + response.headers.get('Ursa-Ddh'));
        }
        const result = await promise;

    } catch (error) {
        console.error('Error:', error);
        return { err: error as string };
    }
}