import { Accessor, Component, createEffect, createMemo, createSignal } from "solid-js";
import { TransformDTO, uint32 } from "../../integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";
import { Styles } from "../../sharedCSS";
import { ClientDTO } from "../../integrations/multiplayer_backend/multiplayerDTO";
import { WrappedSignal } from "../../ts/wrappedSignal";
import { IBackendBased, IStyleOverwritable } from "../../ts/types";

interface PlayerProps extends IStyleOverwritable, IBackendBased{
    client: ClientDTO;
    transformMap: Map<uint32, WrappedSignal<TransformDTO>>;
}

const UNIT_TRANSFORM: TransformDTO = { xOffset: 0, yOffset: 0, zIndex: 0, xScale: 0, yScale: 1 };

const Player: Component<PlayerProps> = (props) => {
    const [currentTransform, setCurrentTransform] = createSignal<TransformDTO>(UNIT_TRANSFORM);

    createEffect(() => {
        //Somehow this is reactive. The client is a proxy object from a store, so I guess thats why
        const currentLoc = props.client.state.lastKnownPosition;
        const transform = props.transformMap.get(currentLoc);
        if (transform) {
            setCurrentTransform(transform.get());
        }
    })

    const computedContainerStyles = createMemo(() => css`
        ${playerContainer}
        ${Styles.transformToCSSVariables(currentTransform())}
        ${Styles.TRANSFORM_APPLICATOR}
        ${props.styleOverwrite}
    `);

    return (
        <div class={computedContainerStyles()} id={"player-"+props.client.IGN}>
            <div class={namePlateStyle}>{props.client.IGN}</div>
        </div>
    )

}
export default Player;

const namePlateStyle = css`
    z-index: 201;
    position: absolute;
    bottom: -7vh;
    left: 50%;
    height: 5vh;
    transform: translateX(-50%);
    color: white;
    font-size: 10px;
    text-align: center;
    text-shadow: 0 0 5px black;
`

const playerContainer = css`
    z-index: 200;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background-color: blue;
    box-shadow: 0 0 10px 0 rgba(255, 255, 255, 0.5);
    transition: top 0.5s ease-in-out, left 0.5s ease-in-out;
`