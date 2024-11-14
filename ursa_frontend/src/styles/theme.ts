import { css } from "@emotion/css";

export const themeBackgroundStyles = {
    FAINT_BACKGROUND: css({
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(0.3rem)",
    }),
    BACKGROUND: css({
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(0.5rem)",
    }),
}