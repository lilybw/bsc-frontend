import { Accessor, Component, createMemo, createSignal, onCleanup, onMount, Setter } from "solid-js";
import { DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, DifficultyConfirmedForMinigameMessageDTO, GENERIC_MINIGAME_SEQUENCE_RESET_EVENT, GENERIC_MINIGAME_UNTIMELY_ABORT_EVENT, LOAD_MINIGAME_EVENT, MINIGAME_BEGINS_EVENT, PLAYER_LOAD_COMPLETE_EVENT, PLAYER_LOAD_FAILURE_EVENT, PLAYER_READY_FOR_MINIGAME_EVENT, PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT } from "@/integrations/multiplayer_backend/EventSpecifications";
import { StrictJSX } from "./ColonyApp";
import ClientTracker from "@/components/colony/mini_games/ClientTracker";
import HandPlacementCheck from "@/components/colony/HandPlacementCheck";
import { ApplicationContext } from "@/meta/types";
import { RetainedColonyInfoForPageSwap } from "@/integrations/vitec/navigator";
import SolarLoadingSpinner from "@/components/base/SolarLoadingSpinner";
import { getMinigameComponentInitFunction, getMinigameName } from "@/components/colony/mini_games/miniGame";

interface MinigameInitiationSequenceProps {
    context: ApplicationContext;
    setPageContent: Setter<StrictJSX>;
    clientTracker: ClientTracker;
    bundleSwapData: RetainedColonyInfoForPageSwap;
    colonyLayout: Accessor<StrictJSX>;
}

interface DiffConfWExtraInfo extends DifficultyConfirmedForMinigameMessageDTO {
    minigameName: string;
}

enum LocalSequencePhase {
    ROAMING_COLONY = 0,
    HAND_PLACEMENT_CHECK = 1,
    WAITING_SCREEN = 2,
    LOADING_MINIGAME = 3,
    IN_MINIGAME = 4,
}

const MinigameSequenceOverlay: Component<MinigameInitiationSequenceProps> = (props) => {
    const [confirmedDifficulty, setConfirmedDifficulty] = createSignal<DiffConfWExtraInfo | null>(null);
    const [localSequencePhase, setLocalSequencePhase] = createSignal<LocalSequencePhase>(LocalSequencePhase.ROAMING_COLONY);

    const log = props.context.logger.copyFor('mg seq');

    onMount(() => {
        const subscribe = props.context.events.subscribe;

        const diffConfirmedSubId = subscribe(DIFFICULTY_CONFIRMED_FOR_MINIGAME_EVENT, (data) => {
            setConfirmedDifficulty({ ...data, minigameName: getMinigameName(data.minigameID) });
            setLocalSequencePhase(LocalSequencePhase.HAND_PLACEMENT_CHECK);
            //When confirmedDifficulty != null, the HandPlacementCheck is shown
            //The HandPlacementCheck emits the required Player Join Activity or Player Aborting Activity
            //And then forwards to the waiting screen
        });

        const declareIntentSubId = subscribe(PLAYERS_DECLARE_INTENT_FOR_MINIGAME_EVENT, (data) => {
            const diff = confirmedDifficulty();
            if (diff === null) {
                log.error('Received intent declaration before difficulty was confirmed');
                return;
            }
            //Needs to be handled.
            //Here is to be emitted Player Ready Event
            props.context.events.emit(PLAYER_READY_FOR_MINIGAME_EVENT, {
                id: props.context.backend.player.local.id,
                ign: props.context.backend.player.local.firstName,
            });
        });

        const loadMinigameSubId = subscribe(LOAD_MINIGAME_EVENT, async (data) => {
            //Load the minigame
            setLocalSequencePhase(LocalSequencePhase.LOADING_MINIGAME);
            const diff = confirmedDifficulty();
            if (diff === null) {
                log.error('Received load minigame while confirmed difficulty was null');
                return;
            }
            props.setPageContent((<SolarLoadingSpinner text={'Loading ' + diff.minigameName} />) as StrictJSX);
            const initFunc = getMinigameComponentInitFunction(diff.minigameID);
            if (initFunc.err !== null) {
                log.error('Could not load minigame component init function: ' + initFunc.err);
                props.context.events.emit(PLAYER_LOAD_FAILURE_EVENT, { reason: initFunc.err });
                return;
            }
            const res = await initFunc.res(props.context, diff.difficultyID);
            if (res.err !== null) {
                log.error('Could not load minigame component: ' + res.err);
                props.context.events.emit(PLAYER_LOAD_FAILURE_EVENT, { reason: res.err });
                return;
            }
            props.setPageContent(res.res as StrictJSX);
            props.context.events.emit(PLAYER_LOAD_COMPLETE_EVENT, {});
        });

        const minigameBeginsSubId = subscribe(MINIGAME_BEGINS_EVENT, (data) => {
            //Start the minigame
            //nothing to do here right now
            setLocalSequencePhase(LocalSequencePhase.IN_MINIGAME);
        });

        const resetSequenceSubID = subscribe(GENERIC_MINIGAME_SEQUENCE_RESET_EVENT, (data) => {
            setConfirmedDifficulty(null);
            setLocalSequencePhase(LocalSequencePhase.ROAMING_COLONY);
        });

        const genericAbortSubId = subscribe(GENERIC_MINIGAME_UNTIMELY_ABORT_EVENT, (data) => {
            //TODO: Show some notification
            log.error('Received generic abort event concerning: ' + data.id + ' with reason: ' + data.reason);
            setConfirmedDifficulty(null);
            props.setPageContent(props.colonyLayout());
            setLocalSequencePhase(LocalSequencePhase.ROAMING_COLONY);
        });
        
        onCleanup(() => {
            props.context.events.unsubscribe(
                diffConfirmedSubId,
                genericAbortSubId,
                minigameBeginsSubId,
                resetSequenceSubID,
                loadMinigameSubId,
                declareIntentSubId
            );
        })
    })
    const appendSequenceOverlay = createMemo(() => {
        switch (localSequencePhase()) {
            case LocalSequencePhase.WAITING_SCREEN:
                return props.clientTracker.getComponent();
            case LocalSequencePhase.HAND_PLACEMENT_CHECK:
                return (
                    <HandPlacementCheck
                        nameOfOwner={props.clientTracker.getByID(props.bundleSwapData.owner)?.IGN || props.context.backend.player.local.firstName}
                        nameOfMinigame={confirmedDifficulty()?.minigameName!}
                        gameToBeMounted={confirmedDifficulty()!}
                        events={props.context.events}
                        backend={props.context.backend}
                        text={props.context.text}
                        clearSelf={() => setConfirmedDifficulty(null)}
                        goToWaitingScreen={() => setLocalSequencePhase(LocalSequencePhase.WAITING_SCREEN)}
                    />) as StrictJSX;
            case LocalSequencePhase.LOADING_MINIGAME:
            case LocalSequencePhase.IN_MINIGAME:
            case LocalSequencePhase.ROAMING_COLONY:
            default: return <></>;
        }
    });
    return (
        <>
        {appendSequenceOverlay()}
        </>
    );
};
export default MinigameSequenceOverlay;