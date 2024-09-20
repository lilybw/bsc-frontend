import { Component, createResource, createSignal } from "solid-js"
import { MenuPageProps } from "../MainMenuApp"
import { ColonyInfoResponseDTO, ColonyOverviewReponseDTO } from "../../src/integrations/main_backend/mainBackendDTOs";
import { ResCodeErr } from "../../src/meta/types";
import SectionTitle from "../../src/components/SectionTitle";


const ColonyListPage: Component<MenuPageProps> = (props) => {
    const [colonyListReq, setColonyListReq] = createResource<ResCodeErr<ColonyOverviewReponseDTO>>(() => props.context.backend.getColonyOverview(1));
    return (
        <div>
            <SectionTitle>Colonies</SectionTitle>
        </div>
    )
}
export default ColonyListPage;