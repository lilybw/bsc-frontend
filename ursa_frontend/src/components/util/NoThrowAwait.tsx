import { Component, createResource, JSX, Show } from "solid-js";
import Spinner from "../SimpleLoadingSpinner";
import SomethingWentWrongIcon from "../SomethingWentWrongIcon";
import { Error, ResErr } from "../../meta/types";
import Unwrap from "./Unwrap";

export interface NoThrowAwaitProps<T> {
    func: () => Promise<ResErr<T>>;
    fallback?: (error: Error) => JSX.Element;
    whilestLoading?: JSX.Element;
    children: (data: T) => JSX.Element;
}

/**
 * For when ResErr<T> is used to avoid trying and catching all sorts of b...
 * 
 * Does however still also handle normal errors
 */
// R is needed here or else the syntax highlighting will break
const NTAwait = <T, R>(props: NoThrowAwaitProps<T>) => {
    const {func, fallback, children} = props;
    const [resource] = createResource<ResErr<T>>(func);
    return (
        <>
            <Show when={resource.loading}>
                {props.whilestLoading ? props.whilestLoading : <Spinner />}
            </Show>
            <Show when={resource.error}>
                {fallback ? fallback(resource.error) : <SomethingWentWrongIcon message={JSON.stringify(resource.error)} />}
            </Show>
            <Show when={resource.latest}>
                <Unwrap data={resource.latest!} fallback={fallback} children={children} />
            </Show>
        </>
    );
}
export default NTAwait;