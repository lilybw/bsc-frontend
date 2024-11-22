// charCodeGenerator.ts

class CharPool {
    private indexPointer: number = 0;
    private symbols: string[];

    constructor(symbolSet: string) {
        this.symbols = symbolSet.split('');
        this.shuffle(this.symbols);
    }

    getNextChar(): string {
        if (this.indexPointer >= this.symbols.length) {
            this.indexPointer = 0;
            this.shuffle(this.symbols);
        }
        const nextChar = this.symbols[this.indexPointer];
        this.indexPointer++;
        return nextChar;
    }

    private shuffle(array: string[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

export class CharCodeGenerator {
    private charPool: CharPool;
    private codeLength: number;

    constructor(symbolSet: string, codeLength: number) {
        this.charPool = new CharPool(symbolSet);
        this.codeLength = codeLength;
    }

    generateCode(): string {
        let code = '';
        for (let i = 0; i < this.codeLength; i++) {
            code += this.charPool.getNextChar();
        }
        return code;
    }
}

export const SYMBOL_SET = 'abcdefghijklmnopqrstuvwxyz';
