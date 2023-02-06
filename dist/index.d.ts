export declare class IPSCluster {
    address: number;
    patchSize: number;
    bytesToPatch?: Uint8Array;
    byteToFill?: number;
    constructor(args: {
        address: number;
        patchSize: number;
        bytesToPatch?: ArrayBuffer;
        byteToFill?: number;
    });
    applyTo(dst: Uint8Array): void;
}
export declare class IPS {
    clusters: Array<IPSCluster>;
    constructor(clusters: Array<IPSCluster>);
    getHighestPatchedOffset(): number;
    applyTo(src: ArrayBufferLike): Uint8Array;
}
export declare class IPSParser {
    magic: String;
    readOffset: number;
    lookEOF(dv: DataView): boolean;
    parseCluster(dv: DataView): IPSCluster | null;
    parseIPS(input: ArrayBufferLike): IPS;
}
