import { createResource } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";

type AsyncFunction<T> = () => Promise<T>;
type FunctionArray<T extends any[]> = AsyncFunction<T[number]> | { [K in keyof T]: () => Promise<T[K]> };

interface MultiAwaitProps<T extends any[]> {
    func: FunctionArray<T>;
    fallback?: (error: any) => JSX.Element;
    whilestLoading?: JSX.Element;
    children: (...args: T) => JSX.Element;
}

/**
 * Await any amount of functions, then, when all promises are resolved, render the children function with the resolved values.
 * On any error, render the fallback function.
 * 
 * Single function example:
 * ```tsx
 * <Await func={() => fetchUser(userId)}>{ userdata => (
 *     <User data={userdata} />
 * )}</Await>
 * ```
 * 
 * Multiple functions example:
 * ```tsx
 * <Await func={[() => fetchUser(userId), () => fetchRecentPosts(userId)]}>{ (userdata, posts) => (
 *    <User data={userdata}>
 *      <For each={posts}>{ post => (
 *         <Post data={post} />
 *     )}</For>
 * )}</Await>
 * ```
 * 
 * @author GustavBW
 */
export const MultiAwait = <T extends any[]>(props: MultiAwaitProps<T>) => {
    const executeFuncs = async () => {
        // props.func is either one function, or an array
        if (typeof props.func === 'function') {
            return await props.func();
        } else {
            return await Promise.all(props.func.map(f => f()));
        }
    };
    const [resource] = createResource(executeFuncs);

    const onFallback = (error: any) => {
        if (props.fallback) {
            return props.fallback(error);
        }
        return (<p>{JSON.stringify(error)}</p>)
    };

    return (
        <>
            {resource.loading && (props.whilestLoading ? props.whilestLoading : <p>Loading...</p>)}
            {resource.error && onFallback(resource.error)}
            {resource.latest && props.children(...(resource.latest as T))}
        </>
    );
}