import { WrappedSignal } from './wrappedSignal';

/**
 * Repressents a global world offset for a given PathGraph
 */
export type Camera = WrappedSignal<{ x: number; y: number }>;
