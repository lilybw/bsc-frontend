import { Component, createMemo } from "solid-js";
import { ColonyLocationInformation } from "../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IStyleOverwritable } from "../../ts/types";
import { css } from "@emotion/css";

interface LocationProps extends IBackendBased, IBufferBased, IStyleOverwritable {
    location: ColonyLocationInformation;
}

const Location: Component<LocationProps> = (props) => {

    const computedContainerStyle = createMemo(() => css`${locationContainerStyle} ${props.styleOverwrite}`);
    return (
        <div class={computedContainerStyle()}>
            Location
        </div>
    )
}
export default Location;

const locationContainerStyle = css`
`