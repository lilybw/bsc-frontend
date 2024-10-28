import { JSX } from "solid-js/jsx-runtime";
import { IBackendBased, IInternationalized, IStyleOverwritable } from "../../src/ts/types";
import { css } from "@emotion/css";
import NTAwait from "../../src/components/util/NoThrowAwait";
import { URSANav } from "../../src/integrations/vitec/navigator";
import BigMenuButton from "../../src/components/base/BigMenuButton";
import GraphicalAsset from "../../src/components/base/GraphicalAsset";
import StarryBackground from "../../src/components/base/StarryBackground";

interface TutorialCompletePageProps extends IInternationalized, IStyleOverwritable, IBackendBased {
    onSlideCompleted: () => void;
    nav: URSANav;
}

export default function TutorialCompletePage(props: TutorialCompletePageProps): JSX.Element {
    setTimeout(() => {
        props.backend.player.grantAchievement(1); 
        props.onSlideCompleted();
    }, 50);

    return (
        <div class="tutorial-complete-page">
            <StarryBackground />
            <NTAwait func={() => props.backend.assets.getMetadata(1018)}>
                {(asset) => (
                    <GraphicalAsset styleOverwrite={imageOverwrite} metadata={asset} backend={props.backend}/>
                )}
            </NTAwait>
            {props.text.Title('TUTORIAL.COMPLETE.TITLE')({styleOverwrite: textOverwrite})}
            <BigMenuButton onClick={() => props.nav.goToMenu()} styleOverwrite={rightNavigationButtonStyle}>
                <NTAwait func={() => props.backend.assets.getMetadata(1019)}>
                  {(asset) => <GraphicalAsset styleOverwrite={footerImageStyleOverwrite} metadata={asset} backend={props.backend}/>}
                </NTAwait>
            </BigMenuButton>
        </div>
    )
}
const navigationButtonStyle = css`
  position: absolute;
  bottom: 0;
  z-index: 10000;
`
const rightNavigationButtonStyle = css`
  ${navigationButtonStyle}
  right: 0;
`
const footerImageStyleOverwrite = css`
height: 10vh;
width: 5vw;
`

const imageOverwrite = css`
position: absolute;
left: 50%;
top: 10%;
transform: translateX(-50%) scaleX(-1);
height: 50%;
`

const textOverwrite = css`
position: absolute;
text-align: center;
bottom: 0;
width: 80%;
left: 50%;
transform: translateX(-50%);
`