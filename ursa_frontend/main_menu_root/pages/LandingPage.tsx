import { Component, createMemo } from 'solid-js';
import { MenuPageProps, MenuPages } from '../MainMenuApp';
import { css } from '@emotion/css';
import BigMenuButton from '../../src/components/base/BigMenuButton';
import { RuntimeMode } from '../../src/meta/types';
import SectionTitle from '../../src/components/base/SectionTitle';
import StarryBackground from '../../src/components/base/StarryBackground';
import GraphicalAsset from '@/components/base/GraphicalAsset';
import NTAwait from '@/components/util/NoThrowAwait';
import { Styles } from '@/styles/sharedCSS';

const LandingPage: Component<MenuPageProps> = (props) => {
    const tutorialOnly = createMemo(() => {
        return !(props.context.env.runtimeMode === RuntimeMode.PRODUCTION && props.context.backend.player.local.hasCompletedTutorial);
    });

    //Lunar Truck id: 5001
    return (
        <>  
            <div class={css([{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '101%', height: '101%',
                    backgroundImage: `linear-gradient(-45deg, transparent, black)`,
                }])}
            />
            <NTAwait func={() => props.context.backend.assets.getMetadata(5001)}>{(asset) => 
                <GraphicalAsset metadata={asset} backend={props.context.backend} styleOverwrite={css({
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '101%', height: '101%',
                    objectFit: 'cover',
                    filter: 'contrast(1.3) blur(2px)',
                    zIndex: -10,
                })}/>
            }</NTAwait>
            <SectionTitle
                styleOverwrite={css`
                    position: absolute;
                    left: 2rem;
                `}
            >
                U.R.S.A.
            </SectionTitle>
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
        </>
    );
};
export default LandingPage;
const menuOptionsListStyle = css({
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    top: "50%",
    left: "9rem",
    width: "24rem",
    transform: "translateY(-50%)",
});
