/**
 * Entity reference for DOM elements
 */
export interface EntityRef {
    type: 'asteroid' | 'player';
    element: HTMLDivElement;
}

/**
 * Type guard for checking entity types
 */
export const isAsteroidRef = (ref: EntityRef): boolean => ref.type === 'asteroid';
export const isPlayerRef = (ref: EntityRef): boolean => ref.type === 'player';