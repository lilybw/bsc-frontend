import { Component, createResource, JSX, Show } from "solid-js";
import { Error, ResCodeErr } from "../../meta/types";
import Spinner from "../SimpleLoadingSpinner";
import SomethingWentWrongIcon from "../SomethingWentWrongIcon";

export interface AwaitProps<T,R extends Component> {
    func: () => Promise<T>;
    fallback?: (error: any) => Component;
    children: (data: T) => R;
}

const Await = <T, R extends Component>(props: AwaitProps<T, R>) => {
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
                {children(resource.latest!)({})}
            </Show>
        </>
    );
}
export default Await;