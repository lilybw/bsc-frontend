import { Component } from "solid-js";
import { MinigameLostMessageDTO } from "@/integrations/multiplayer_backend/EventSpecifications";
import { IBackendBased, IBufferBased, IInternationalized, IRegistering } from "@/ts/types";
import { getMinigameName } from "@/components/colony/mini_games/miniGame";
import PostGameScreen from "./PostGameScreen";

interface DefeatScreenProps extends IBackendBased, IRegistering<string>, IInternationalized, IBufferBased {
    data: MinigameLostMessageDTO;
    clearSelf: () => void;
}

const DefeatScreen: Component<DefeatScreenProps> = (props) => {
    return (
        <PostGameScreen
            title="MINIGAME.DEFEAT"
            titleColor="red"
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

export default DefeatScreen;