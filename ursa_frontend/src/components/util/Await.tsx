import { Component, createResource, JSX, Show } from "solid-js";
import { Error, ResCodeErr } from "../../meta/types";
import Spinner from "../SimpleLoadingSpinner";
import SomethingWentWrongIcon from "../SomethingWentWrongIcon";

export interface AwaitProps<T> {
    func: () => Promise<T>;
    fallback?: (error: any) => Component;
    children: (data: T) => JSX.Element;
}

// R is needed here or else the syntax highlighting will break
const Await = <T, R>(props: AwaitProps<T>) => {
    const {func, fallback, children} = props;
    const [resource, {refetch, mutate}] = createResource<T>(func);
    return (
        <>
            <Show when={resource.loading}>
                <Spinner />
            </Show>
            <Show when={resource.error}>
                {fallback ? fallback(resource.error) : <SomethingWentWrongIcon message={JSON.stringify(resource.error)} />}
            </Show>
            <Show when={resource.latest}>
                {children(resource.latest!)}
            </Show>
        </>
    );
}
export default Await;