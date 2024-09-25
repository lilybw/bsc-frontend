import { Component, createResource, JSX, Show } from "solid-js";
import Spinner from "../SimpleLoadingSpinner";
import SomethingWentWrongIcon from "../SomethingWentWrongIcon";
import { Error, ResErr } from "../../meta/types";

export interface NoThrowAwaitProps<T, R extends Component> {
    func: () => Promise<ResErr<T>>;
    fallback?: (error: Error) => Component;
    children: (data: T) => JSX.Element;
}

/**
 * For when ResErr<T> is used to avoid trying and catching all sorts of b...
 */
const NTAwait = <T, R extends Component>(props: NoThrowAwaitProps<T, R>) => {
    const {func, fallback, children} = props;
    const [resource, {refetch, mutate}] = createResource<ResErr<T>>(func);
    return (
        <>
            <Show when={resource.loading}>
                <Spinner />
            </Show>
            <Show when={resource.error}>
                {fallback ? fallback(resource.error) : <SomethingWentWrongIcon message={JSON.stringify(resource.error)} />}
            </Show>
            <Show when={resource.latest}>
                <Show when={resource.latest?.err !== null}>
                    {fallback ? fallback(resource.latest!.err!) : <SomethingWentWrongIcon message={resource.latest?.err} />}
                </Show>
                <Show when={resource.latest?.res !== null}>
                    {children(resource.latest!.res!)}
                </Show>
            </Show>
        </>
    );
}
export default NTAwait;