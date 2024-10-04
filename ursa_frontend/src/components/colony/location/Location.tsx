import { Accessor, Component, createMemo } from "solid-js";
import { ColonyLocationInformation } from "../../../integrations/main_backend/mainBackendDTOs";
import { IBackendBased, IBufferBased, IRegistering, IStyleOverwritable } from "../../../ts/types";
import { css } from "@emotion/css";

interface LocationProps extends IBackendBased, IBufferBased, IStyleOverwritable, IRegistering<string> {
    location: ColonyLocationInformation;
    dns: Accessor<{x: number, y: number}>;
    gas: Accessor<number>;
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