import { Component, createMemo, createSignal, Show } from 'solid-js';
import NavigationFooter from '../NavigationFooter';
import { css } from '@emotion/css';
import { Styles } from '../../src/styles/sharedCSS';
import NTAwait from '../../src/components/util/NoThrowAwait';
import { ApplicationContext, Error } from '../../src/meta/types';
import StarryBackground from '../../src/components/base/StarryBackground';
import GraphicalAsset from '../../src/components/base/GraphicalAsset';
import SectionSubTitle from '../../src/components/base/SectionSubTitle';
import { MenuPages } from '@menu/MainMenuApp';

const JoinColonyPage: Component<{ context: ApplicationContext, goToPage: (page: MenuPages) => void, goBack: () => void}> = (props) => {
    const [colonyCode, setColonyCode] = createSignal('');
    const [codeError, setCodeError] = createSignal<string | undefined>(undefined);
    const [inputEngaged, setInputEngaged] = createSignal(false);

    async function handleJoin() {
        if (!checkInput()) return;
        const code = Number(colonyCode());
        // Join the colony
        const joinResponse = await props.context.backend.colony.join(code);

        // Handle the response as needed
        if (joinResponse.err !== null) {
            switch (joinResponse.code) {
                case 404:
                    setCodeError('No colony by that code');
                    break;
                default:
                    setCodeError(joinResponse.err);
            }
            return;
        }

        const colonyInfoAttempt = await props.context.backend.colony.get(joinResponse.res.owner, joinResponse.res.colonyId);
        if (colonyInfoAttempt.err !== null) {
            setCodeError('Failed to get colony info: ' + colonyInfoAttempt.err);
            return;
        }

        // Go to the colony
        props.context.nav.goToColony(colonyInfoAttempt.res.id, colonyInfoAttempt.res.name, joinResponse.res.owner, code);
    }

    const checkInput = (): boolean => {
        const codeLength = 6;
        const inputCode = colonyCode().trim();

        // Check if the input is empty
        if (inputCode === '') {
            setCodeError('ERRORS.PLEASE_ENTER_CODE');
            return false;
        }

        // Check if the input consists only of digits
        if (!/^\d+$/.test(inputCode)) {
            setCodeError('ERRORS.NUMERIC_ONLY');
            return false;
        }

        // Check the length of the input
        if (inputCode.length < codeLength) {
            setCodeError('ERRORS.CODE_TOO_SHORT');
            return false;
        }

        if (inputCode.length > codeLength) {
            setCodeError('ERRORS.CODE_TOO_LONG');
            return false;
        }

        // Convert to number after all string checks are done
        const numericCode = Number(inputCode);
        if (Number.isNaN(numericCode)) {
            setCodeError('ERRORS.NAN');
        }

        // Check if the number is negative (although this should never happen given the regex check)
        if (numericCode < 0) {
            setCodeError('ERRORS.CODE_CANT_BE_NEGATIVE');
            return false;
        }

        setCodeError(undefined);
        setColonyCode(numericCode.toString());
        return true;
    };

    const getFallbackOnNoConnection = (e: Error) => {
        return (
            <>
                {props.context.text.SubTitle('ERRORS.CONNECTION.MULTIPLAYER_BACKEND')({})}
                <NTAwait func={() => props.context.backend.assets.getMetadata(1023)}>
                    {(metadata) => (
                        <GraphicalAsset
                            backend={props.context.backend}
                            metadata={metadata}
                            styleOverwrite={css`
                                width: 10vw;
                                height: 10vw;
                                left: 50%;
                                transform: translateX(-50%);
                            `}
                        />
                    )}
                </NTAwait>
                <SectionSubTitle styleOverwrite={errMsgStyle}>{e}</SectionSubTitle>
            </>
        );
    };

    const computedInputStyle = createMemo(
        () => css`
            ${Styles.MENU_INPUT}
            ${inputStyleOverwrite}
        `,
    );
    return (
        <div>
            {props.context.text.Title('MENU.PAGE_TITLE.JOIN_COLONY')({ styleOverwrite: pageTitleStyle })}
            <NTAwait func={props.context.backend.healthCheck} fallback={(e) => getFallbackOnNoConnection(e)}>
                {(status) => (
                    <>
                        <Show when={!status.multiplayerStatus.status}>{getFallbackOnNoConnection('')}</Show>
                        <Show when={status.multiplayerStatus.status}>
                            <div class={inputContainerStyle}>
                                {props.context.text.SubTitle('MENU.SUB_TITLE.INSERT_CODE_HERE')({})}
                                <input
                                    id="ColonyCode"
                                    type="number"
                                    value={colonyCode()}
                                    placeholder="123 123"
                                    onInput={(e) => setColonyCode(e.currentTarget.value)}
                                    onFocus={() => setInputEngaged(true)}
                                    class={computedInputStyle()}
                                />
                            </div>
                            {codeError() && inputEngaged() && props.context.text.SubTitle(codeError()!)({ styleOverwrite: errMsgStyle })}
                        </Show>
                    </>
                )}
            </NTAwait>
            <NavigationFooter
                text={props.context.text}
                goBack={{ name: 'MENU.NAVIGATION.BACK', func: props.goBack }}
                goNext={{ name: 'MENU.OPTION.JOIN_COLONY', func: handleJoin }}
                goNextEnabled={createMemo(() => checkInput() && inputEngaged())}
            />
            <StarryBackground backend={props.context.backend} />
        </div>
    );
};
export default JoinColonyPage;

const errMsgStyle = css`
    position: absolute;
    filter: none;
    font-size: 1.5rem;
    top: 65%;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    margin: 0;
`;
const pageTitleStyle = css`
    font-size: 5rem;
    width: 50%;
    left: 1vh;
    position: absolute;
`;

const inputStyleOverwrite = css`
    font-size: 20vh;
    width: 80%;
    height: fit-content;
`;

const inputContainerStyle = css`
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    width: 66%;
    left: 50%;
    top: 45%;

    transform: translate(-50%, -50%);
`;
