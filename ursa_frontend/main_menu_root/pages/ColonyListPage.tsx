import { Component, createEffect, createResource, createSignal, For, Show } from "solid-js"
import { MenuPageProps } from "../MainMenuApp"
import { ColonyInfoResponseDTO, ColonyOverviewReponseDTO, UpdateLatestVisitResponseDTO, UpdateLatestVisitRequestDTO } from "../../src/integrations/main_backend/mainBackendDTOs";
import { ResCodeErr } from "../../src/meta/types";
import SectionTitle from "../../src/components/SectionTitle";
import SomethingWentWrongIcon from "../../src/components/SomethingWentWrongIcon";
import Spinner from "../../src/components/SimpleLoadingSpinner";
import { css } from "@emotion/css";
import StarryBackground from "../../src/components/StarryBackground";
import ColonyListEntry from "./ColonyListEntry";
import NavigationFooter from "../NavigationFooter";
import NTAwait from "../../src/components/util/NoThrowAwait";
import If from "../../src/components/util/If";
import SectionSubTitle from "../../src/components/SectionSubTitle";

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
                timeZone: 'Europe/Copenhagen',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        };
        const body: UpdateLatestVisitRequestDTO = {
            latestVisit: getCurrentDateTimeLocaleString()
        }
        props.context.backend.updateLatestVisit(body, colonyID)

        props.context.backend.getColony(props.context.backend.localPlayer.id, colonyID)
            .then(res => {
                if (res.err !== null) {
                    props.context.logger.error("Failed to get colony: " + res.err);
                    return;
                } else {
                    props.context.nav.goToColony(res.res);
                }
            })
    }

    return (
        <div>
            <SectionTitle styleOverwrite={css`font-size: 5rem;`}>Select</SectionTitle>
            <NTAwait func={() => props.context.backend.getColonyOverview(props.context.backend.localPlayer.id)}>{(overview) =>
                <If condition={overview.colonies.length > 0}>{[
                    <>
                    <div class={colonyListBackgroundStyle}/>
                    <div class={colonyListStyle}>
                    <For each={sortedColonies(overview)}>{(colony: ColonyInfoResponseDTO) =>
                        <ColonyListEntry 
                            colony={colony} 
                            onClick={() => setSelectedColonyId(colony.id)} 
                            isSelected={selectedColonyId() === colony.id}
                            text={props.context.text}
                        />
                    }</For>
                    </div>
                    </>,
                    props.context.text.SubTitle('MENU.SUB_TITLE.NO_COLONIES_YET')({})
                ]}</If>
            }</NTAwait>
            <NavigationFooter 
                text={props.context.text}
                goBack={{name: "MENU.NAVIGATION.BACK", func: props.goBack}} 
                goNext={{name: "MENU.NAVIGATION.CONFIRM", func: handleGoToColony}} 
                goNextEnabled={() => selectedColonyId() !== null}
            />
            <StarryBackground />
        </div>
    )
}

export default ColonyListPage;

const colonyListBackgroundStyle = css`
    display: flex;
    flex-direction: column;

    position: absolute;
    width: 66%;
    height: 32rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 1rem;
    gap: 1rem;

    border-radius: 5%;
    border: .25rem solid white;
    border-left: 0px;
    border-right: 0px;

    backdrop-filter: blur(.5rem);
    -webkit-backdrop-filter: blur(.5rem);  // For Safari support
    box-shadow: 0 0 1rem rgba(255, 255, 255, .2) inset, 0 0 1rem black;
`

const colonyListStyle = css`
    ${colonyListBackgroundStyle}
    justify-content: flex-start;
    align-items: center;

    top: 10.5rem;
    border: none;
    height: 31rem;
    width: 64%;
    transform: translateX(-50%);

    overflow: visible;
    overflow-y: scroll;
    overflow-x: hidden;

    backdrop-filter: none;
    -webkit-backdrop-filter: none;  // For Safari support
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
        border: .1rem solid black;  // Creates padding around the thumb, cant have transparency...
        border-radius: 1rem;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
    }
`

const spinnerStyleOverwrite = css`
    margin: 0 auto;
    display: block;
    padding: 1rem;
    height: 3rem;
    width: 3rem;
`