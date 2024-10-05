import {test, describe, expect} from 'vitest';
import { computeCommonSubUrl } from './vitecIntegration';

describe('Vitec Integration tests', async () => {

    describe('Compute common sub url tests', () => {
        test('When the current sub url is the base sub url, it the output should be the base sub url', () => {
            const noExtensionsKnown = {};
            expect(computeCommonSubUrl("/arg/arg", noExtensionsKnown)).toEqual("/arg/arg");
            const someExtensionsKnownButNoneMatching = {extension: 'extension'};
            expect(computeCommonSubUrl("/arg/arg", someExtensionsKnownButNoneMatching)).toEqual("/arg/arg");
            //And if both or one is an empty string
            expect(computeCommonSubUrl("", someExtensionsKnownButNoneMatching)).toEqual("");
        })

        test('If the current sub url has a trailing slash, it should be removed', () => {
            const knownExtensions = {};
            expect(computeCommonSubUrl('/arg/arg/', knownExtensions)).toEqual('/arg/arg');
            //And with some extensions
            const someExtensionsKnown = {extension: 'extension'};
            expect(computeCommonSubUrl('/arg/arg/', someExtensionsKnown)).toEqual('/arg/arg');
        })

        test('When the current sub url is a known extension of the base sub url, the extension should be removed', () => {
            const currentSubUrl = '/arg/arg/extension';
            const baseSubUrl = '/arg/arg';
            const knownExtensions = {extension: 'extension'};
            expect(computeCommonSubUrl(currentSubUrl, knownExtensions)).toEqual(baseSubUrl);
            const complexExtensions = {extension: 'extension', otherExtension: '/arg/arg'};
            expect(computeCommonSubUrl('/arg/arg/extension/arg/arg', complexExtensions)).toEqual('/arg/arg/extension');
        })

    })

})