import { Component, Setter } from "solid-js";
import { IEventMultiplexer } from "../../integrations/multiplayer_backend/eventMultiplexer";
import { ActionContext, TypeIconTuple } from "../../ts/actionContext";
import { css } from "@emotion/css";
import { DifficultyConfirmedForMinigameMessageDTO, PLAYER_JOIN_ACTIVITY_EVENT } from "../../integrations/multiplayer_backend/EventSpecifications";
import BufferBasedButton from "../BufferBasedButton";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from "../../ts/types";

interface HandplacementCheckProps extends IBackendBased, IInternationalized, IRegistering<string>, IBufferBased {
    gameToBeMounted: DifficultyConfirmedForMinigameMessageDTO;
    events: IEventMultiplexer;
    setActionContext: Setter<TypeIconTuple>;
}

const HandPlacementCheck: Component<HandplacementCheckProps> = (props) => {
    props.setActionContext(ActionContext.INTERACTION);
    return (
        <div class={containerStyles}>
            <BufferBasedButton 
                buffer={props.buffer} 
                register={props.register} 
                onActivation={() => {
                    props.setActionContext(ActionContext.NAVIGATION);
                    props.events.emit(PLAYER_JOIN_ACTIVITY_EVENT, { 
                        id: props.backend.localPlayer.id,
                        ign: props.backend.localPlayer.firstName,
                    });
                }}
                name="join"
            />
        </div>
    )
}
export default HandPlacementCheck;

const containerStyles = css`
    display: flex;
    position: fixed;
    justify-content: center;

    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 66%;
    height: 40%;
`