import { ENV } from '../../environment/manager';
import { Logger } from '../../logging/filteredLogger';
import { ResErr } from '../../meta/types';
import { ColonyInfoResponseDTO, PlayerInfoResponseDTO } from '../main_backend/mainBackendDTOs';
import { VitecIntegrationInformation } from './vitecDTOs';

export type URSANav = {
    /**
     * Change page to show the colony.
     * 
     * Only data passed to this function will be retained.
     */
    goToColony: (colony: ColonyInfoResponseDTO, player: PlayerInfoResponseDTO) => void;
    /**
     * Change page to show the tutorial.
     * 
     * Only data passed to this function will be retained.
     */
    goToTutorial: (player: PlayerInfoResponseDTO) => void;
    /**
     * Change page to show the menu.
     * 
     * Only data passed to this function will be retained.
     */
    goToMenu: (player: PlayerInfoResponseDTO) => void;
    /**
     * When called, the content is removed from storage solution to avoid state management issues.
     */
    getRetainedUserInfo: () => ResErr<PlayerInfoResponseDTO>;
    /**
     * When called, the content is removed from storage solution to avoid state management issues.
     */
    getRetainedColonyInfo: () => ResErr<ColonyInfoResponseDTO>;
};

export const initNavigator = async (vitecInfo: VitecIntegrationInformation, logger: Logger, environment: ENV): Promise<ResErr<URSANav>> => {
    if (!vitecInfo.locationUrl) {
        return { res: null, err: 'Location URL missing' };
    }
    if (!vitecInfo.currentSubUrl) {
        return { res: null, err: 'Current sub URL missing' };
    }
    return { res: new UrsaNavImpl(vitecInfo, logger, environment), err: null };
};

const pageSwitchUserInfoKey = 'ursaPageSwitchRetainedUserInfo';
const pageSwitchColonyInfoKey = 'ursaPageSwitchRetainedColonyInfo';

class UrsaNavImpl implements URSANav {
    constructor(
        private readonly vitecInfo: VitecIntegrationInformation,
        private readonly logger: Logger,
        private readonly environment: ENV
    ){}
    goToColony = (colonyInfo: ColonyInfoResponseDTO, player: PlayerInfoResponseDTO) => {
        sessionStorage.setItem(pageSwitchUserInfoKey, JSON.stringify(player));
        sessionStorage.setItem(pageSwitchColonyInfoKey, JSON.stringify(colonyInfo));
        this.logger.log('[nav] Navigating to colony');
        window.location.href = this.vitecInfo.locationUrl + this.vitecInfo.currentSubUrl + '/colony';
    };
    goToTutorial = (player: PlayerInfoResponseDTO) => {
        throw new Error('Method not implemented.');
    };
    goToMenu = (player: PlayerInfoResponseDTO) => {
        throw new Error('Method not implemented.');
    };
    getRetainedUserInfo = () => {
        throw new Error('Method not implemented.');
    };
    getRetainedColonyInfo = () => {
        throw new Error('Method not implemented.');
    };
}
