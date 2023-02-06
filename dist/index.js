"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPSParser = exports.IPS = exports.IPSCluster = void 0;
class IPSCluster {
    constructor(args) {
        this.address = args.address;
        this.patchSize = args.patchSize;
        this.bytesToPatch = args.bytesToPatch != null ? new Uint8Array(args.bytesToPatch) : undefined;
        this.byteToFill = args.byteToFill;
    }
    applyTo(dst) {
        if (this.bytesToPatch != null) {
            for (var i = 0; i < this.patchSize; i++) {
                dst[this.address + i] = this.bytesToPatch[i];
            }
        }
        else if (this.byteToFill != null) {
            for (var i = 0; i < this.patchSize; i++) {
                dst[this.address + i] = this.byteToFill;
            }
        }
    }
}
exports.IPSCluster = IPSCluster;
class IPS {
    constructor(clusters) {
        this.clusters = clusters;
    }
    getHighestPatchedOffset() {
        var res = 0;
        for (const cluster of this.clusters) {
            const offset = cluster.address + cluster.patchSize;
            if (res < offset) {
                res = offset;
            }
        }
        return res;
    }
    applyTo(src) {
        const patchedSize = Math.max(src.byteLength, this.getHighestPatchedOffset());
        const dst = new ArrayBuffer(patchedSize);
        const res = new Uint8Array(dst);
        res.set(new Uint8Array(src));
        for (const cluster of this.clusters) {
            cluster.applyTo(res);
        }
        return res;
    }
}
exports.IPS = IPS;
class IPSParser {
    constructor() {
        this.magic = 'PATCH';
        this.readOffset = 0;
    }
    lookEOF(dv) {
        for (var i = 0; i < 3; i++) {
            if (dv.getUint8(this.readOffset + i) != 'EOF'.charCodeAt(i)) {
                return false;
            }
        }
        return true;
    }
    parseCluster(dv) {
        if (this.lookEOF(dv)) {
            return null;
        }
        const address = dv.getUint32(this.readOffset) >> 8;
        this.readOffset += 3;
        const size = dv.getUint16(this.readOffset);
        this.readOffset += 2;
        if (size == 0) {
            const patchSize = dv.getUint16(this.readOffset);
            this.readOffset += 2;
            const byteToFill = dv.getUint8(this.readOffset);
            this.readOffset++;
            return new IPSCluster({ address, patchSize, byteToFill });
        }
        else {
            const bytesToPatch = new Uint8Array(dv.buffer.slice(dv.byteOffset + this.readOffset, dv.byteOffset + this.readOffset + size));
            this.readOffset += size;
            return new IPSCluster({ address, patchSize: size, bytesToPatch });
        }
    }
    parseIPS(input) {
        const dv = new DataView(input);
        for (var i = 0; i < this.magic.length; i++) {
            if (dv.getUint8(this.readOffset++) != this.magic.charCodeAt(i)) {
                throw new Error('Invalid Magic. The binary is not an IPS format.');
            }
        }
        const clusters = new Array();
        while (true) {
            const cluster = this.parseCluster(dv);
            if (cluster == null)
                break;
            clusters.push(cluster);
        }
        return new IPS(clusters);
    }
}
exports.IPSParser = IPSParser;
