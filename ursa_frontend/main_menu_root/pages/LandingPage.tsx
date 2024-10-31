import { Component, createMemo } from 'solid-js';
import { MenuPageProps, MenuPages } from '../MainMenuApp';
import { css } from '@emotion/css';
import BigMenuButton from '../../src/components/base/BigMenuButton';
import { RuntimeMode } from '../../src/meta/types';
import SectionTitle from '../../src/components/base/SectionTitle';
import StarryBackground from '../../src/components/base/StarryBackground';

const LandingPage: Component<MenuPageProps> = (props) => {
    const tutorialOnly = createMemo(() => {
        return !(props.context.env.runtimeMode === RuntimeMode.PRODUCTION && props.context.backend.player.local.hasCompletedTutorial);
    });

    return (
        <>
            <SectionTitle styleOverwrite={css`position: absolute; left: 1vh;`}>U.R.S.A.</SectionTitle>
            <div class={menuOptionsListStyle}>
                <BigMenuButton enable={tutorialOnly} onClick={() => props.goToPage(MenuPages.NEW_COLONY)}>
                    {props.context.text.get('MENU.OPTION.NEW_COLONY').get()}
                </BigMenuButton>
                <BigMenuButton enable={tutorialOnly} onClick={() => props.goToPage(MenuPages.CONTINUE_COLONY)}>
                    {props.context.text.get('MENU.OPTION.CONTINUE_COLONY').get()}
                </BigMenuButton>
                <BigMenuButton enable={tutorialOnly} onClick={() => props.goToPage(MenuPages.JOIN_COLONY)}>
                    {props.context.text.get('MENU.OPTION.JOIN_COLONY').get()}
                </BigMenuButton>
                <BigMenuButton onClick={() => props.context.nav.goToTutorial()}>{props.context.text.get('MENU.OPTION.TUTORIAL').get()}</BigMenuButton>
            </div>
            <StarryBackground />
        </>
    );
};
export default LandingPage;
const menuOptionsListStyle = css`
    display: flex;
    flex-direction: column;
    align-items: left;
    position: absolute;
    top: 55%;
    left: 50%;
    width: 33%;
    transform: translate(-50%, -50%);
`;
