import { Component, For, onCleanup, onMount } from 'solid-js';
import { css } from '@emotion/css';
import { StrictJSX } from '../../../colony_root/ColonyApp';
import { IEventMultiplexer } from '../../integrations/multiplayer_backend/eventMultiplexer';
import {
    PLAYER_LEFT_EVENT,
    PLAYER_JOINED_EVENT,
    SERVER_CLOSING_EVENT,
    LOBBY_CLOSING_EVENT,
} from '../../integrations/multiplayer_backend/EventSpecifications';
import { Styles } from '../../styles/sharedCSS';
import { createArrayStore } from '../../ts/arrayStore';
import { IBackendBased, IInternationalized } from '../../ts/types';

interface EventFeedProps extends IBackendBased, IInternationalized {
    events: IEventMultiplexer;
}

const eventFeedMessageDurationMS = 10_000;

const EventFeed: Component<EventFeedProps> = (props) => {
    const eventFeed = createArrayStore<StrictJSX>();
    const log = props.backend.logger.copyFor('event feed');
    onMount(() => {
        // Set up event subscriptions
        const playerLeaveSubId = props.events.subscribe(PLAYER_LEFT_EVENT, (data) => {
            const removeFunc = eventFeed.add(
                (
                    <div class={eventFeedMessageStyle}>
                        <div
                            class={css`
                                color: hsla(32, 100%, 36%, 1);
                            `}
                        >
                            {data.ign}
                        </div>
                        <div
                            class={css`
                                color: hsla(32, 100%, 36%, 1);
                            `}
                        >
                            Left
                        </div>
                    </div>
                ) as StrictJSX,
            );
            setTimeout(removeFunc, eventFeedMessageDurationMS);
        });

        const playerJoinSubId = props.events.subscribe(PLAYER_JOINED_EVENT, (data) => {
            const removeFunc = eventFeed.add(
                (
                    <div class={eventFeedMessageStyle}>
                        <div
                            class={css`
                                color: hsla(131, 100%, 27%, 1);
                            `}
                        >
                            {data.ign}
                        </div>
                        <div
                            class={css`
                                color: hsla(131, 100%, 27%, 1);
                            `}
                        >
                            Joined
                        </div>
                    </div>
                ) as StrictJSX,
            );
            setTimeout(removeFunc, eventFeedMessageDurationMS);
        });

        const serverClosingSubId = props.events.subscribe(SERVER_CLOSING_EVENT, (ev) => {
            const removeFunc = eventFeed.add(
                (
                    <div class={eventFeedMessageStyle}>
                        <div
                            class={css`
                                color: hsla(352, 100%, 29%, 1);
                            `}
                        >
                            Server Closing
                        </div>
                    </div>
                ) as StrictJSX,
            );
            setTimeout(removeFunc, eventFeedMessageDurationMS);
        });

        const lobbyClosingSubId = props.events.subscribe(LOBBY_CLOSING_EVENT, (ev) => {
            const removeFunc = eventFeed.add(
                (
                    <div class={eventFeedMessageStyle}>
                        <div>Lobby Closing</div>
                    </div>
                ) as StrictJSX,
            );
            setTimeout(removeFunc, eventFeedMessageDurationMS);
        });

        onCleanup(() => {
            props.events.unsubscribe(playerLeaveSubId, playerJoinSubId, serverClosingSubId, lobbyClosingSubId);
        });
    });

    return (
        <div class={eventFeedContainerStyle} id="event-feed">
            <For each={eventFeed.get}>{(event) => event}</For>
        </div>
    );
};
export default EventFeed;

// Styles
const eventFeedMessageStyle = css`
    display: flex;
    flex-direction: column;
    justify-content: left;
    align-items: center;
    width: 90%;
    height: 5vh;
    font-size: 1.5rem;
    padding: 0.5rem;
    color: white;
    ${Styles.FANCY_BORDER}
    background-color: rgba(0, 0, 0, 0.7);
    border-color: rgba(255, 255, 255, 0.5);
    ${Styles.ANIM.FADE_OUT(eventFeedMessageDurationMS / 1000)}
`;

const eventFeedContainerStyle = css`
    position: fixed;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    right: 0;
    bottom: 0;
    height: 50vh;
    width: 15vw;
    row-gap: 1vh;
    z-index: 1000;
    overflow: hidden;
`;
