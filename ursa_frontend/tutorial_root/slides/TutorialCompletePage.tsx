import { JSX } from "solid-js/jsx-runtime";
import StarryBackground from "../../src/components/StarryBackground";
import { IBackendBased, IInternationalized, IStyleOverwritable } from "../../src/ts/types";
import { css } from "@emotion/css";
import Await from "../../src/components/util/Await";
import { ResCodeErr } from "../../src/meta/types";
import { AssetResponseDTO } from "../../src/integrations/main_backend/mainBackendDTOs";
import GraphicalAsset from "../../src/components/GraphicalAsset";
import NTAwait from "../../src/components/util/NoThrowAwait";

interface TutorialCompletePageProps extends IInternationalized, IStyleOverwritable, IBackendBased {
    onSlideCompleted: () => void;
}

export default function TutorialCompletePage(props: TutorialCompletePageProps): JSX.Element {
    setTimeout(() => props.onSlideCompleted(), 50);
    return (
        <div class="tutorial-complete-page">
            <StarryBackground />
            <NTAwait func={() => props.backend.getAssetMetadata(21)}>
                {(asset) => (
                    <GraphicalAsset styleOverwrite={imageOverwrite} metadata={asset} backend={props.backend}/>
                )}
            </NTAwait>
            {props.text.Title('TUTORIAL.COMPLETE.TITLE')({styleOverwrite: textOverwrite})}
        </div>
    )
}

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