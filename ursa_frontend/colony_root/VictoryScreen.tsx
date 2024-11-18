import { Component } from "solid-js";
import { MinigameWonMessageDTO } from "@/integrations/multiplayer_backend/EventSpecifications";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from "@/ts/types";
import { getMinigameName } from "@/components/colony/mini_games/miniGame";
import PostGameScreen from "./PostGameScreen";

interface VictoryScreenProps extends IBackendBased, IRegistering<string>, IInternationalized, IBufferBased {
    data: MinigameWonMessageDTO;
    clearSelf: () => void;
}

const VictoryScreen: Component<VictoryScreenProps> = (props) => {
    return (
        <PostGameScreen
            title="MINIGAME.VICTORY"
            titleColor="orange"
            minigameID={props.data.minigameID}
            minigameName={getMinigameName(props.data.minigameID)}
            difficultyName={props.data.difficultyName}
            clearSelf={props.clearSelf}
            text={props.text}
            buffer={props.buffer}
            register={props.register}
            backend={props.backend}
        />
    );
};

export default VictoryScreen;