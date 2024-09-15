import { ENV } from "./manager";
import { RuntimeMode } from "../meta/types";

export const DEV_ENVIRONMENT: ENV = {
    runtimeMode: RuntimeMode.DEVELOPMENT,
    thisIsUndefined: undefined
}