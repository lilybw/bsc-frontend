import { PlayerID } from '../main_backend/mainBackendDTOs';
import { EventSpecification, GoType, IMessage } from './EventSpecifications';
import { RawMessage } from './multiplayerBackend';

/**
 * Reads the header of the message (sourceID and eventID)
 */
export const readSourceAndEventID = (view: DataView): { sourceID: number; eventID: number } => {
    const sourceID = view.getUint32(0, false);
    const eventID = view.getUint32(4, false);
    return { sourceID, eventID };
};

/**
 * Computes the size of the content in data ignoring all fields not described by the spec.
 * Creates a dataview of that size and goes through the fields again, serializing them to binary and placing
 * them in the view at the offsets described by the spec.
 *
 * Exeptionally allowed to THROW
 */
export const createViewAndSerializeMessage = <T extends IMessage>(data: T, spec: EventSpecification<T>): DataView => {
    //This can technically be optimized by writing to some stand-in buffer first while computing the size.
    //Then passing it directly to DataView with some length parameter. Not very parallelizable though, but possible.
    const size = computeActualSizeOfMessage(data, spec);
    //DataView is constant size, so the full length needed has to be computed beforehand.
    //Also not possible to overwrite contents, so not pool-able.
    const view = new DataView(new ArrayBuffer(size));

    //Write sourceID and eventID
    placeValueAtOffsetAsTypeInView(view, 0, data.senderID, GoType.UINT32);
    placeValueAtOffsetAsTypeInView(view, 4, spec.id, GoType.UINT32);
    //Write data
    let offset = 8;
    for (const messageElement of spec.structure) {
        placeValueAtOffsetAsTypeInView(view, offset, data[messageElement.fieldName as keyof T], messageElement.type);
        offset += messageElement.byteSize;
    }

    return view;
};
/**
 * Serialize a value to its binary version in the view
 * 
 * By default uses big endian.
 * 
 * EXCEPTIONALLY allowed to THROW
 */
export const placeValueAtOffsetAsTypeInView = <T>(view: DataView, offset: number, value: T, type: GoType, littleEndian: boolean = false): void => {
    switch (type) {
        case GoType.UINT8:
            view.setUint8(offset, value as unknown as number);
            break;
        case GoType.UINT16:
            view.setUint16(offset, value as unknown as number, littleEndian);
            break;
        case GoType.UINT32:
            view.setUint32(offset, value as unknown as number, littleEndian);
            break;
        case GoType.UINT64:
            view.setBigUint64(offset, value as unknown as bigint, littleEndian);
            break;
        case GoType.INT8:
            view.setInt8(offset, value as unknown as number);
            break;
        case GoType.INT16:
            view.setInt16(offset, value as unknown as number, littleEndian);
            break;
        case GoType.INT32:
            view.setInt32(offset, value as unknown as number, littleEndian);
            break;
        case GoType.INT64:
            view.setBigInt64(offset, value as unknown as bigint, littleEndian);
            break;
        case GoType.FLOAT32:
            view.setFloat32(offset, value as unknown as number, littleEndian);
            break;
        case GoType.FLOAT64:
            view.setFloat64(offset, value as unknown as number, littleEndian);
            break;
        case GoType.BOOL:
            view.setUint8(offset, (value as unknown as boolean) ? 1 : 0);
            break;
        case GoType.STRING:
            //Serialize string into view
            const strBytes = new TextEncoder().encode(value as unknown as string);
            for (let i = 0; i < strBytes.length; i++) {
                view.setUint8(offset + i, strBytes[i]);
            }
            break;
        default:
            throw new Error(`Unknown GoType: ${type}`);
    }
};
const textEncoder = new TextEncoder();
/**
 * Runs through all fields in the data object named by the specification structure.
 * If any is of variable size (byte size 0), it computes the size of the data and returns the sum total.
 * Also adds on 8 bytes for the header (sourceID and eventID)
 */
export const computeActualSizeOfMessage = <T extends IMessage>(data: T, spec: EventSpecification<T>): number => {
    let size = 8; //sourceID and eventID
    for (const messageElement of spec.structure) {
        //If the size is 0 - its a variable size, which must be computed
        if (messageElement.byteSize !== 0) {
            size += messageElement.byteSize;
        } else {
            const value = data[messageElement.fieldName as keyof T];
            switch (typeof value) {
                case 'string':
                    size += textEncoder.encode(value).length;
                    break;
                default:
                    throw new Error(`Unsupported variable size type: ${typeof value}`);
            }
        }
    }
    return size;
};

export const serializeTypeFromViewAndSpec = <T extends IMessage>(view: DataView, sourceID: PlayerID, spec: EventSpecification<T>): T => {
    const decoded: T = {
        senderID: sourceID,
        eventID: spec.id,
    } as T;

    for (const messageElement of spec.structure) {
        const fieldName = messageElement.fieldName;
        const value = parseGoTypeAtOffsetInView(view, messageElement.offset, messageElement.type);
        decoded[fieldName as keyof T] = value as T[keyof T];
    }

    return decoded;
}

/**
 * Read the bytes at that offset and use DataView.getXXXX to parse them into the corresponding JS type.
 *
 * Defaults to reading as big endian.
 * 
 * Exeptionally allowed to THROW
 */
export const parseGoTypeAtOffsetInView = <T>(view: DataView, offset: number, type: GoType, littleEndian: boolean = false): T => {
    switch (type) {
        case GoType.UINT8:
            return view.getUint8(offset) as unknown as T;
        case GoType.UINT16:
            return view.getUint16(offset, littleEndian) as unknown as T;
        case GoType.UINT32:
            return view.getUint32(offset, littleEndian) as unknown as T;
        case GoType.UINT64:
            return view.getBigUint64(offset, littleEndian) as unknown as T;
        case GoType.INT8:
            return view.getInt8(offset) as unknown as T;
        case GoType.INT16:
            return view.getInt16(offset, littleEndian) as unknown as T;
        case GoType.INT32:
            return view.getInt32(offset, littleEndian) as unknown as T;
        case GoType.INT64:
            return view.getBigInt64(offset, littleEndian) as unknown as T;
        case GoType.FLOAT32:
            return view.getFloat32(offset, littleEndian) as unknown as T;
        case GoType.FLOAT64:
            return view.getFloat64(offset, littleEndian) as unknown as T;
        case GoType.BOOL:
            return view.getUint8(offset) === 1 ? (true as unknown as T) : (false as unknown as T);
        case GoType.STRING:
            //Parse all data in view from offset as string
            const strBytes = new Uint8Array(view.buffer, offset, view.byteLength - offset);
            return new TextDecoder().decode(strBytes) as unknown as T;
        default:
            throw new Error(`Unknown GoType: ${type}`);
    }
};
