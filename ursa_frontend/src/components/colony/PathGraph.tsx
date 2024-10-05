import { Accessor, Component, For } from "solid-js";
import { ColonyInfoResponseDTO } from "../../integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";
import { IBackendBased, IInternationalized } from "../../ts/types";

interface PathGraphProps extends IBackendBased, IInternationalized {
    colony: ColonyInfoResponseDTO;
}

/**
 * Autoscales based on viewport size to normalize layout regardless of screen size.
 * 0,0 for the PathGraph is concidered the middle of the screen.
 */
const PathGraph: Component<PathGraphProps> = (props) => {

    return (
        <div class={containerStyle}>
        </div>
    )
}
export default PathGraph;

const containerStyle = css`

`