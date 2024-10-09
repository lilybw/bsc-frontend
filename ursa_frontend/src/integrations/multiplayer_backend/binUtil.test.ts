import { expect, suite, test, vi } from 'vitest';
import { computeActualSizeOfMessage, parseGoTypeAtOffsetInView, placeValueAtOffsetAsTypeInView } from './binUtil';
import { RawMessage } from './multiplayerBackend';

suite('placeValueAtOffsetAsTypeInView', () => {
    test('should set UINT8 correctly', () => {
        const view = new DataView(new ArrayBuffer(1));
        placeValueAtOffsetAsTypeInView(view, 0, 255, GoType.UINT8);
        expect(view.getUint8(0)).toBe(255);
    });

    test('should set UINT16 correctly', () => {
        const view = new DataView(new ArrayBuffer(2));
        placeValueAtOffsetAsTypeInView(view, 0, 65535, GoType.UINT16);
        expect(view.getUint16(0, true)).toBe(65535);
    });

    test('should set UINT32 correctly', () => {
        const view = new DataView(new ArrayBuffer(4));
        placeValueAtOffsetAsTypeInView(view, 0, 4294967295, GoType.UINT32);
        expect(view.getUint32(0, true)).toBe(4294967295);
    });

    test('should set UINT64 correctly', () => {
        const view = new DataView(new ArrayBuffer(8));
        placeValueAtOffsetAsTypeInView(view, 0, BigInt('18446744073709551615'), GoType.UINT64);
        expect(view.getBigUint64(0, true)).toBe(BigInt('18446744073709551615'));
    });

    test('should set INT8 correctly', () => {
        const view = new DataView(new ArrayBuffer(1));
        placeValueAtOffsetAsTypeInView(view, 0, -128, GoType.INT8);
        expect(view.getInt8(0)).toBe(-128);
    });

    test('should set INT16 correctly', () => {
        const view = new DataView(new ArrayBuffer(2));
        placeValueAtOffsetAsTypeInView(view, 0, -32768, GoType.INT16);
        expect(view.getInt16(0, true)).toBe(-32768);
    });

    test('should set INT32 correctly', () => {
        const view = new DataView(new ArrayBuffer(4));
        placeValueAtOffsetAsTypeInView(view, 0, -2147483648, GoType.INT32);
        expect(view.getInt32(0, true)).toBe(-2147483648);
    });

    test('should set INT64 correctly', () => {
        const view = new DataView(new ArrayBuffer(8));
        placeValueAtOffsetAsTypeInView(view, 0, BigInt('-9223372036854775808'), GoType.INT64);
        expect(view.getBigInt64(0, true)).toBe(BigInt('-9223372036854775808'));
    });

    test('should set FLOAT32 correctly', () => {
        const view = new DataView(new ArrayBuffer(4));
        placeValueAtOffsetAsTypeInView(view, 0, 3.14, GoType.FLOAT32);
        expect(view.getFloat32(0, true)).toBeCloseTo(3.14, 5);
    });

    test('should set FLOAT64 correctly', () => {
        const view = new DataView(new ArrayBuffer(8));
        placeValueAtOffsetAsTypeInView(view, 0, 3.14159265359, GoType.FLOAT64);
        expect(view.getFloat64(0, true)).toBeCloseTo(3.14159265359, 10);
    });

    test('should set BOOL correctly', () => {
        const view = new DataView(new ArrayBuffer(1));
        placeValueAtOffsetAsTypeInView(view, 0, true, GoType.BOOL);
        expect(view.getUint8(0)).toBe(1);

        placeValueAtOffsetAsTypeInView(view, 0, false, GoType.BOOL);
        expect(view.getUint8(0)).toBe(0);
    });

    test('should set STRING correctly', () => {
        const testString = 'Hello, World!';
        const view = new DataView(new ArrayBuffer(testString.length));
        placeValueAtOffsetAsTypeInView(view, 0, testString, GoType.STRING);

        const resultArray = new Uint8Array(view.buffer);
        const decodedString = new TextDecoder().decode(resultArray);
        expect(decodedString).toBe(testString);
    });

    test('should throw an error for unknown GoType', () => {
        const view = new DataView(new ArrayBuffer(1));
        expect(() => placeValueAtOffsetAsTypeInView(view, 0, 0, 'UNKNOWN' as GoType)).toThrow('Unknown GoType: UNKNOWN');
    });
});

suite('computeActualSizeOfMessage', () => {
    const createMockSpec = (structure: any[]): EventSpecification<any> => ({
        id: 0,
        name: 'TestEvent',
        permissions: { guest: true, owner: true, server: true },
        expectedMinSize: 0,
        structure,
    });

    test('should compute size correctly for fixed-size fields', () => {
        const spec = createMockSpec([
            { fieldName: 'field1', byteSize: 4, type: GoType.UINT32 },
            { fieldName: 'field2', byteSize: 8, type: GoType.INT64 },
        ]);
        const data = { senderID: 1, eventID: 1, field1: 123, field2: BigInt(456) };
        expect(computeActualSizeOfMessage(data, spec)).toBe(20); // 8 (base) + 4 + 8
    });

    test('should compute size correctly for string fields', () => {
        const spec = createMockSpec([{ fieldName: 'field1', byteSize: 0, type: GoType.STRING }]);
        const data = { senderID: 1, eventID: 1, field1: 'Hello, World!' };
        expect(computeActualSizeOfMessage(data, spec)).toBe(21); // 8 (base) + 13 (string length)
    });

    test('should compute size correctly for mixed fixed-size and string fields', () => {
        const spec = createMockSpec([
            { fieldName: 'field1', byteSize: 4, type: GoType.UINT32 },
            { fieldName: 'field2', byteSize: 0, type: GoType.STRING },
            { fieldName: 'field3', byteSize: 8, type: GoType.FLOAT64 },
        ]);
        const data = { senderID: 1, eventID: 1, field1: 123, field2: 'Test', field3: 3.14 };
        expect(computeActualSizeOfMessage(data, spec)).toBe(24); // 8 (base) + 4 + 4 (string length) + 8
    });

    test('should throw an error for unsupported variable size types', () => {
        const spec = createMockSpec([{ fieldName: 'field1', byteSize: 0, type: GoType.UINT32 }]);
        const data = { senderID: 1, eventID: 1, field1: [1, 2, 3] };
        expect(() => computeActualSizeOfMessage(data, spec)).toThrow('Unsupported variable size type: object');
    });

    test('should handle empty structure correctly', () => {
        const spec = createMockSpec([]);
        const data = { senderID: 1, eventID: 1 };
        expect(computeActualSizeOfMessage(data, spec)).toBe(8); // Just the base size
    });

    test('should handle UTF-8 characters correctly', () => {
        const spec = createMockSpec([{ fieldName: 'field1', byteSize: 0, type: GoType.STRING }]);
        const data = { senderID: 1, eventID: 1, field1: '你好' }; // Chinese characters
        const expectedSize = 8 + new TextEncoder().encode('你好').length;
        expect(computeActualSizeOfMessage(data, spec)).toBe(expectedSize);
    });
});

suite('parseGoTypeAtOffsetInView', () => {
    const encoder = new TextEncoder();

    test('should parse UINT8 correctly', () => {
        const buffer = new ArrayBuffer(1);
        const view = new DataView(buffer);
        view.setUint8(0, 255);
        expect(parseGoTypeAtOffsetInView<number>(view, 0, GoType.UINT8)).toBe(255);
    });

    test('should parse UINT16 correctly', () => {
        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer);
        view.setUint16(0, 65535, true);
        expect(parseGoTypeAtOffsetInView<number>(view, 0, GoType.UINT16)).toBe(65535);
    });

    test('should parse UINT32 correctly', () => {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setUint32(0, 4294967295, true);
        expect(parseGoTypeAtOffsetInView<number>(view, 0, GoType.UINT32)).toBe(4294967295);
    });

    test('should parse UINT64 correctly', () => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setBigUint64(0, BigInt('18446744073709551615'), true);
        expect(parseGoTypeAtOffsetInView<bigint>(view, 0, GoType.UINT64)).toBe(BigInt('18446744073709551615'));
    });

    test('should parse INT8 correctly', () => {
        const buffer = new ArrayBuffer(1);
        const view = new DataView(buffer);
        view.setInt8(0, -128);
        expect(parseGoTypeAtOffsetInView<number>(view, 0, GoType.INT8)).toBe(-128);
    });

    test('should parse INT16 correctly', () => {
        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer);
        view.setInt16(0, -32768, true);
        expect(parseGoTypeAtOffsetInView<number>(view, 0, GoType.INT16)).toBe(-32768);
    });

    test('should parse INT32 correctly', () => {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setInt32(0, -2147483648, true);
        expect(parseGoTypeAtOffsetInView<number>(view, 0, GoType.INT32)).toBe(-2147483648);
    });

    test('should parse INT64 correctly', () => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setBigInt64(0, BigInt('-9223372036854775808'), true);
        expect(parseGoTypeAtOffsetInView<bigint>(view, 0, GoType.INT64)).toBe(BigInt('-9223372036854775808'));
    });

    test('should parse FLOAT32 correctly', () => {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setFloat32(0, 3.14, true);
        expect(parseGoTypeAtOffsetInView<number>(view, 0, GoType.FLOAT32)).toBeCloseTo(3.14, 5);
    });

    test('should parse FLOAT64 correctly', () => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setFloat64(0, 3.14159265359, true);
        expect(parseGoTypeAtOffsetInView<number>(view, 0, GoType.FLOAT64)).toBeCloseTo(3.14159265359, 10);
    });

    test('should parse BOOL correctly', () => {
        const buffer = new ArrayBuffer(1);
        const view = new DataView(buffer);
        view.setUint8(0, 1);
        expect(parseGoTypeAtOffsetInView<boolean>(view, 0, GoType.BOOL)).toBe(true);
        view.setUint8(0, 0);
        expect(parseGoTypeAtOffsetInView<boolean>(view, 0, GoType.BOOL)).toBe(false);
    });

    test('should parse STRING correctly', () => {
        const testString = 'Hello, World!';
        const buffer = encoder.encode(testString);
        const view = new DataView(buffer.buffer);
        expect(parseGoTypeAtOffsetInView<string>(view, 0, GoType.STRING)).toBe(testString);
    });

    test('should parse STRING with UTF-8 characters correctly', () => {
        const testString = '你好，世界！';
        const buffer = encoder.encode(testString);
        const view = new DataView(buffer.buffer);
        expect(parseGoTypeAtOffsetInView<string>(view, 0, GoType.STRING)).toBe(testString);
    });

    test('should throw an error for unknown GoType', () => {
        const buffer = new ArrayBuffer(1);
        const view = new DataView(buffer);
        expect(() => parseGoTypeAtOffsetInView(view, 0, 'UNKNOWN' as GoType)).toThrow('Unknown GoType: UNKNOWN');
    });

    test('should respect littleEndian parameter', () => {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        const testValue = 0x12345678;
        view.setUint32(0, testValue, false); // big-endian
        expect(parseGoTypeAtOffsetInView<number>(view, 0, GoType.UINT32, false)).toBe(testValue);
        expect(parseGoTypeAtOffsetInView<number>(view, 0, GoType.UINT32, true)).not.toBe(testValue);
    });

    test('should parse at correct offset', () => {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setUint32(0, 0xaabbccdd, true);
        view.setUint32(4, 0x11223344, true);
        expect(parseGoTypeAtOffsetInView<number>(view, 4, GoType.UINT32)).toBe(0x11223344);
    });
});

import * as moduleToTest from './binUtil';
import { EventSpecification, GoType } from './EventSpecifications';
// Create a type-safe mock of the entire module
const mockedModule = vi.mocked(moduleToTest, true);

// Mock placeValueAtOffsetAsTypeInView specifically
vi.spyOn(moduleToTest, 'placeValueAtOffsetAsTypeInView');
