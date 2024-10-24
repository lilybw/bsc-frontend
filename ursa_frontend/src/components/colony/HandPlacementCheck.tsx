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
    goToWaitingScreen: () => void;
    clearSelf: () => void;
}

const HandPlacementCheck: Component<HandplacementCheckProps> = (props) => {
    props.setActionContext(ActionContext.INTERACTION);
    return (
        <div class={overlayStyle}>
            <div class={containerStyles}>
                <div class={contentStyle}>
                    <h2 class={titleStyle}>Ready to Join?</h2>
                    <div class={buttonContainerStyle}>
                        <BufferBasedButton 
                            buffer={props.buffer} 
                            register={props.register} 
                            onActivation={() => {
                                props.setActionContext(ActionContext.NAVIGATION);
                                props.events.emit(PLAYER_JOIN_ACTIVITY_EVENT, { 
                                    id: props.backend.localPlayer.id,
                                    ign: props.backend.localPlayer.firstName,
                                });
                                props.goToWaitingScreen();
                                props.clearSelf();
                            }}
                            name="join"
                        />
                        <BufferBasedButton 
                            buffer={props.buffer} 
                            register={props.register} 
                            onActivation={() => {
                                props.setActionContext(ActionContext.NAVIGATION);
                                props.clearSelf();
                            }}
                            name="leave"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
export default HandPlacementCheck;

const overlayStyle = css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000000;
`;

const containerStyles = css`
    position: relative;
    width: 50%;
    max-width: 600px;
    z-index: 1000000;
`;

const contentStyle = css`
    position: relative;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 20px;
    padding: 2rem;
    width: 100%;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    gap: 2rem;
    align-items: center;
`;

const titleStyle = css`
    font-size: 2rem;
    color: #00ffff;
    text-align: center;
    margin: 0;
    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    position: relative;
    z-index: 1;
`;

const buttonContainerStyle = css`
    display: flex;
    justify-content: center;
    gap: 2rem;
    position: relative;
    z-index: 1;
    width: 100%;
`;