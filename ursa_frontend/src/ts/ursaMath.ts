import { TransformDTO } from '../integrations/main_backend/mainBackendDTOs';
export const combineTransforms = (a: TransformDTO, b: TransformDTO): TransformDTO => {
    return {
        xOffset: a.xOffset + b.xOffset,
        yOffset: a.yOffset + b.yOffset,
        zIndex: a.zIndex + b.zIndex,
        xScale: a.xScale * b.xScale,
        yScale: a.yScale * b.yScale,
    };
};

export const lerp = (observed: number, rangeA: number, rangeB: number): number => {
    if (observed < rangeA) return rangeA;
    if (observed > rangeB) return rangeB;
    return rangeA + (rangeB - rangeA) * observed;
}

export class PooledRandom {
    private readonly pool: number[] = [];
    private nextIndex = 0;
    constructor(
        private readonly poolSize: number = 1000,
    ){
        this.pool = Array.from({ length: this.poolSize }, Math.random);
    }
    private refreshPool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.pool[i] = Math.random();
        }
        this.nextIndex = 0;
    }
    /** range 0-1 */
    public next(): number {
        if (this.nextIndex >= this.poolSize) {
            this.refreshPool();
        }
        return this.pool[this.nextIndex++];
    }
    public nextInRange(min: number, max: number): number {
        return lerp(this.next(), min, max);
    }
    public nextInt(min: number, max: number): number {
        return Math.floor(this.nextInRange(min, max));
    }
}
export const GlobalRandom: Readonly<PooledRandom> = new PooledRandom();

export class HashPool {
    private readonly pool: string[] = [];
    private nextIndex = 0;
    constructor(
        private readonly poolSize: number = 1000,
    ){
        this.pool = new Array(this.poolSize);
        this.refreshPool();
    }
    private refreshPool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.pool[i] = GlobalRandom.next().toString(36).substring(7);
        }
        this.nextIndex = 0;
    }
    public next(): string {
        if (this.nextIndex >= this.poolSize) {
            this.refreshPool();
        }
        return this.pool[this.nextIndex++];
    }
}
export const GlobalHashPool: Readonly<HashPool> = new HashPool();
