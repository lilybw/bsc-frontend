import { TransformDTO } from "@/integrations/main_backend/mainBackendDTOs";
import { css } from "@emotion/css";

export const positionalStyles = {
    TRANSFORM_CENTER_X: css({
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
    }),
    TRANSFORM_CENTER_Y: css({
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
    }),
    TRANSFORM_CENTER: css({
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
    }),
    transformToCSSVariables: (transform?: TransformDTO) => css`
        --transform-x: ${transform ? transform.xOffset : 0}px;
        --transform-y: ${transform ? transform.yOffset : 0}px;
        --transform-index: ${transform ? transform.zIndex : 1};
        --transform-xScale: ${transform ? transform.xScale : 1};
        --transform-yScale: ${transform ? transform.yScale : 1};
    `,
    TRANSFORM_APPLICATOR: css({
        position: "absolute",
        left: "var(--transform-x)",
        top: "var(--transform-y)",
        zIndex: "var(--transform-index)",
        transform: "scale(var(--transform-xScale), var(--transform-yScale)) translate(-50%, -50%)",
    }),
    FULL_SCREEN: css({
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
    }),
};