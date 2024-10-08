import { Component, createMemo } from "solid-js";
import { css } from "@emotion/css";
import { TransformDTO } from "../../src/integrations/main_backend/mainBackendDTOs";
import { Camera } from "../../src/ts/camera"
interface PlayerProps {
    transform: TransformDTO;
    dns: () => { x: number; y: number };
    gas: () => number;
    camera: Camera;
    isLocal: boolean;
    ign?: string;
}

const Player: Component<PlayerProps> = (props) => {
    const position = createMemo(() => {
        const cameraPos = props.camera.get();
        const dns = props.dns();
        return {
            x: (props.transform.xOffset - cameraPos.x) * dns.x,
            y: (props.transform.yOffset - cameraPos.y) * dns.y
        };
    });

    const playerStyle = createMemo(() => css`
        position: absolute;
        left: ${position().x}px;
        top: ${position().y}px;
        width: ${20 * props.gas()}px;
        height: ${20 * props.gas()}px;
        background-color: ${props.isLocal ? 'blue' : 'red'};
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: left 0.3s ease, top 0.3s ease;
    `);

    const labelStyle = css`
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        font-size: ${12 * props.gas()}px;
        color: white;
        text-shadow: 1px 1px 2px black;
    `;

    return (
        <div class={playerStyle()}>
            {props.ign && <div class={labelStyle}>{props.ign}</div>}
        </div>
    );
};

export default Player;