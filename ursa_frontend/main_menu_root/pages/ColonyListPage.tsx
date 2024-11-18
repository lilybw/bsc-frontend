import { Component, createSignal, For } from 'solid-js';
import { MenuPageProps, MenuPages } from '../MainMenuApp';
import { ColonyInfoResponseDTO, ColonyOverviewReponseDTO, UpdateLatestVisitRequestDTO } from '../../src/integrations/main_backend/mainBackendDTOs';
import { css } from '@emotion/css';
import ColonyListEntry from './ColonyListEntry';
import NavigationFooter from '../NavigationFooter';
import NTAwait from '../../src/components/util/NoThrowAwait';
import BigMenuButton from '../../src/components/base/BigMenuButton';
import { Styles } from '../../src/styles/sharedCSS';
import StarryBackground from '../../src/components/base/StarryBackground';

const ColonyListPage: Component<MenuPageProps> = (props) => {
    const [selectedColonyId, setSelectedColonyId] = createSignal<number | null>(null);

    const sortedColonies = (colonyListReq: ColonyOverviewReponseDTO) => {
        return [...colonyListReq.colonies].sort((a, b) => {
            const dateA = new Date(a.latestVisit);
            const dateB = new Date(b.latestVisit);
            return dateB.getTime() - dateA.getTime(); // Sort in descending order (most recent first)
        });
    };

    async function handleGoToColony() {
        const colonyID = selectedColonyId();
        if (colonyID === null) {
            return;
        }

        const getCurrentDateTimeLocaleString = () => {
            const now = new Date();
            return now.toLocaleString('en-US', {
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });
        };
        const body: UpdateLatestVisitRequestDTO = {
            latestVisit: getCurrentDateTimeLocaleString(),
        };
        props.context.backend.colony.updateLatestVisit(body, colonyID);

        props.context.backend.colony.get(props.context.backend.player.local.id, colonyID).then((res) => {
            if (res.err !== null) {
                props.context.logger.error('Failed to get colony: ' + res.err);
                return;
            } else {
                props.context.nav.goToColony(res.res.id, res.res.name, props.context.backend.player.local.id);
            }
        });
    }

    const getContent = (overview: ColonyOverviewReponseDTO) => {
        if (overview.colonies.length > 0) {
            return (
                <>
                    <div class={colonyListBackgroundStyle} />
                    <div class={colonyListStyle}>
                        <For each={sortedColonies(overview)}>
                            {(colony: ColonyInfoResponseDTO) => (
                                <ColonyListEntry
                                    colony={colony}
                                    onClick={() => setSelectedColonyId(colony.id)}
                                    isSelected={selectedColonyId() === colony.id}
                                    text={props.context.text}
                                />
                            )}
                        </For>
                    </div>
                </>
            );
        } else {
            return (
                <div class={noColoniesYetStyle}>
                    {props.context.text.SubTitle('MENU.SUB_TITLE.NO_COLONIES_YET')({})}
                    <BigMenuButton
                        onClick={() => props.goToPage(MenuPages.NEW_COLONY)}
                        styleOverwrite={css`
                            width: fit-content;
                        `}
                    >
                        {props.context.text.get('MENU.OPTION.CREATE_COLONY').get()}
                    </BigMenuButton>
                </div>
            );
        }
    };

    return (
        <div>
            {props.context.text.Title('MENU.PAGE_TITLE.SELECT_COLONY')({ styleOverwrite: pageTitleStyle })}
            <NTAwait func={() => props.context.backend.colony.getOverview(props.context.backend.player.local.id)}>{getContent}</NTAwait>
            <NavigationFooter
                text={props.context.text}
                goBack={{ name: 'MENU.NAVIGATION.BACK', func: () => props.goToPage(MenuPages.LANDING_PAGE) }}
                goNext={{ name: 'MENU.NAVIGATION.CONFIRM', func: handleGoToColony }}
                goNextEnabled={() => selectedColonyId() !== null}
            />
            <StarryBackground backend={props.context.backend} />
        </div>
    );
};

export default ColonyListPage;

const noColoniesYetStyle = css`
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    top: 20vh;
    left: 50%;
    width: 50%;
    transform: translateX(-50%);
`;

const pageTitleStyle = css`
    font-size: 5rem;
    left: 1vh;
    position: absolute;
`;

const backgroundTopVh = 14;
const backgroundHeightVh = 65;
const colonyListBackgroundStyle = css`
    display: flex;
    flex-direction: column;

    position: absolute;
    width: 66%;
    height: ${backgroundHeightVh}vh;
    left: 50%;
    top: ${backgroundTopVh}vh;
    transform: translateX(-50%);
    padding: 1rem;
    gap: 1rem;

    ${Styles.FANCY_BORDER}
`;

const colonyListStyle = css`
    ${colonyListBackgroundStyle}
    justify-content: flex-start;
    align-items: center;

    top: calc(${backgroundTopVh}vh + 2vh);
    border: none;
    height: calc(${backgroundHeightVh}vh - 4vh);
    width: 64%;
    transform: translateX(-50%);

    overflow: visible;
    overflow-y: scroll;
    overflow-x: hidden;

    backdrop-filter: none;
    -webkit-backdrop-filter: none; // For Safari support
    box-shadow: none;

    // Custom scrollbar styles
    &::-webkit-scrollbar {
        width: 1rem;
    }
    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        margin: 2rem;
        border-radius: 1rem;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 1);
        width: 1rem;
        border: 0.1rem solid black; // Creates padding around the thumb, cant have transparency...
        border-radius: 1rem;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
    }
`;
