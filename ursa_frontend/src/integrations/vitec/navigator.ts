import { ENV } from "../../environment/manager";
import { ResErr } from "../../meta/types";
import { VitecIntegrationInformation } from "./vitecDTOs";

export type URSANav = {
    
}

export const initNavigator = async (vitecInfo: VitecIntegrationInformation, environment: ENV): Promise<ResErr<Navigator>> => {

    
    return {res: navigator, err: null};
}