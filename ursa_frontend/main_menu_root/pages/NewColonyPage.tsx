import { Component, createSignal, JSX } from 'solid-js';
import { css } from '@emotion/css';
import NavigationFooter from '../NavigationFooter';
import { CreateColonyRequestDTO } from '../../src/integrations/main_backend/mainBackendDTOs';
import { Styles } from '../../src/styles/sharedCSS';
import SectionSubTitle from '../../src/components/base/SectionSubTitle';
import StarryBackground from '../../src/components/base/StarryBackground';
import PlanetMoonSystem from '@/components/base/PlanetWithMoon';
import { ApplicationContext } from '@/meta/types';
import { MenuPages } from '@menu/MainMenuApp';

const NewColonyPage: Component<{ context: ApplicationContext, goToPage: (page: MenuPages) => void, goBack: () => void}> = (props) => {
    const [colonyName, setColonyName] = createSignal('');
    const [textError, setTextError] = createSignal<string | undefined>(undefined);
    const [inputEngaged, setInputEngaged] = createSignal(false);

    const checkInput = () => {
        // Trim the colony name to remove any leading or trailing whitespace
        const trimmedName = colonyName().trim();

        // Check if the name is empty after trimming
        if (trimmedName.length === 0) {
            setTextError('Colony name cannot be empty.');
            return false;
        }

        // Check if the name is too short
        if (trimmedName.length < 4) {
            setTextError('Colony name must be at least 4 characters long.');
            return false;
        }

        // Check if the name is too long
        if (trimmedName.length > 32) {
            setTextError('Colony name cannot exceed 32 characters.');
            return false;
        }

        // Check if the name contains only alphabetic characters and spaces
        if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
            setTextError('Colony name can only contain letters and spaces.');
            return false;
        }

        // If we've made it this far, the input is valid
        setTextError(undefined);
        setColonyName(trimmedName);
        return true;
    };

    async function handleCreateColony() {
        // If we've made it this far, the input is valid
        setTextError(undefined);

        // Create the colony
        const body: CreateColonyRequestDTO = {
            name: colonyName(),
        };
        const createColonyResponse = await props.context.backend.colony.create(body, props.context.backend.player.local.id);

        // Handle the response as needed
        if (createColonyResponse.err !== null) {
            setTextError(String(createColonyResponse.err));
            return;
        }

        props.context.nav.goToColony(createColonyResponse.res.id, createColonyResponse.res.name, props.context.backend.player.local.id);
    }

    return (
        <div class={pageStyle} id={'new-colony-page'}>
            {props.context.text.Title('MENU.PAGE_TITLE.CREATE_COLONY')({ styleOverwrite: titleStyle })}
            <div class={inputContainerStyle}>
                {props.context.text.SubTitle('MENU.SUB_TITLE.NAME_COLONY')({
                    styleOverwrite: css`
                        text-align: left;
                    `,
                })}
                <input
                    id="colonyName"
                    type="text"
                    value={colonyName()}
                    placeholder="Nunaat"
                    onInput={(e) => setColonyName(e.currentTarget.value)}
                    class={Styles.MENU_INPUT}
                    onFocus={() => setInputEngaged(true)}
                />
            </div>
            {textError() && inputEngaged() && <SectionSubTitle styleOverwrite={errMsgStyle}>{textError()}</SectionSubTitle>}
            <StarryBackground backend={props.context.backend} />
            <div class={planetContainerStyle}>
                <PlanetMoonSystem backend={props.context.backend}
                    styleOverwrite={css({ width: '50vw', height: '50vw' })}
                />
            </div>
            <NavigationFooter
                text={props.context.text}
                goBack={{ name: 'MENU.NAVIGATION.BACK', func: props.goBack }}
                goNext={{ name: 'MENU.OPTION.CREATE_COLONY', func: handleCreateColony }}
                goNextEnabled={checkInput}
            />
        </div>
    );
};

export default NewColonyPage;

const errMsgStyle = css`
    position: absolute;
    left: 5vw;
    text-align: left;
    filter: none;
    font-size: 1.5rem;
    top: 58%;
`;

const planetContainerStyle = css`
    position: fixed;
    right: 0;
    top: 0;
    width: 50vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: none;
`;

const pageStyle = css`
    height: 90vh;
    display: flex;
`;

const titleStyle = css`
    font-size: 5rem;
    width: 60%;
    left: 1vh;
    position: absolute;
`;

const inputContainerStyle = css`
    position: absolute;
    display: flex;
    flex-direction: column;
    top: 50%;
    left: 5vw;
    width: 60vw;
    transform: translateY(-50%);
`;