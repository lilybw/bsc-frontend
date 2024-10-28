import { Component, createResource, JSX, Show } from "solid-js";
import { Error, ResErr } from "../../meta/types";
import Spinner from "../base/SimpleLoadingSpinner";
import SomethingWentWrongIcon from "../base/SomethingWentWrongIcon";

export interface NoThrowAwaitProps<T, R extends Component> {
    primary: () => Promise<ResErr<T>>;
    secondary: () => Promise<ResErr<T>>;
    fallback?: (error: Error) => Component;
    children: (data: T) => JSX.Element;
}

/**
 * For when ResErr<T> is used to avoid trying and catching all sorts of b...
 * 
 * Has a primary and secondary resource, with an optional fallback
 */
const BNTAwait = <T, R extends Component>(props: NoThrowAwaitProps<T, R>) => {
    const {primary, secondary, fallback, children} = props;
    const [primaryResource] = createResource<ResErr<T>>(primary);
    const [secondaryResource] = createResource<ResErr<T>>(secondary);

    const getSecondaryOrFallback = () => {
        if (secondaryResource.error) {
            return fallback ? fallback(secondaryResource.error) : <SomethingWentWrongIcon message={JSON.stringify(secondaryResource.error)} />;
        }
        if (secondaryResource.latest) {
            if (secondaryResource.latest.err !== null) {
                return fallback ? fallback(secondaryResource.latest.err) : <SomethingWentWrongIcon message={secondaryResource.latest.err} />;
            }
            if (secondaryResource.latest.res !== null) {
                return children(secondaryResource.latest.res);
            }
        }
        return <Spinner />;
    }

    return (
        <>
            <Show when={primaryResource.loading}>
                <Spinner />
            </Show>
            <Show when={primaryResource.error}>
                {getSecondaryOrFallback()}
            </Show>
            <Show when={primaryResource.latest}>
                <Show when={primaryResource.latest?.err !== null}>
                    {getSecondaryOrFallback()}
                </Show>
                <Show when={primaryResource.latest?.res !== null}>
                    {children(primaryResource.latest!.res!)}
                </Show>
            </Show>
        </>
    );
}
export default BNTAwait;