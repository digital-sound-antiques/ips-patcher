export class IPSCluster {
  address: number;
  patchSize: number;
  bytesToPatch?: Uint8Array;
  byteToFill?: number;

  constructor(args: { address: number, patchSize: number, bytesToPatch?: ArrayBuffer, byteToFill?: number }) {
    this.address = args.address;
    this.patchSize = args.patchSize;
    this.bytesToPatch = args.bytesToPatch != null ? new Uint8Array(args.bytesToPatch!) : undefined;
    this.byteToFill = args.byteToFill;
  }

  applyTo(dst: Uint8Array): void {
    if (this.bytesToPatch != null) {
      for (var i = 0; i < this.patchSize; i++) {
        dst[this.address + i] = this.bytesToPatch[i];
      }
    } else if (this.byteToFill != null) {
      for (var i = 0; i < this.patchSize; i++) {
        dst[this.address + i] = this.byteToFill;
      }
    }
  }
}


export class IPS {
  clusters: Array<IPSCluster>;
  constructor(clusters: Array<IPSCluster>) {
    this.clusters = clusters;
  }

  getHighestPatchedOffset(): number {
    var res = 0;
    for (const cluster of this.clusters) {
      const offset = cluster.address + cluster.patchSize;
      if (res < offset) {
        res = offset;
      }
    }
    return res;
  }

  applyTo(src: ArrayBufferLike): Uint8Array {
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

export class IPSParser {
  magic: String = 'PATCH';
  readOffset: number = 0;

  lookEOF(dv: DataView): boolean {
    for (var i = 0; i < 3; i++) {
      if (dv.getUint8(this.readOffset + i) != 'EOF'.charCodeAt(i)) {
        return false;
      }
    }
    return true;
  }

  parseCluster(dv: DataView): IPSCluster | null {

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
    } else {
      const bytesToPatch = new Uint8Array(dv.buffer.slice(dv.byteOffset + this.readOffset, dv.byteOffset + this.readOffset + size));
      this.readOffset += size;
      return new IPSCluster({ address, patchSize: size, bytesToPatch });
    }
  }

  parseIPS(input: ArrayBufferLike): IPS {

    const dv = new DataView(input);
    for (var i = 0; i < this.magic.length; i++) {
      if (dv.getUint8(this.readOffset++) != this.magic.charCodeAt(i)) {
        throw new Error('Invalid Magic. The binary is not an IPS format.');
      }
    }
    const clusters = new Array<IPSCluster>();
    while (true) {
      const cluster = this.parseCluster(dv);
      if (cluster == null) break;
      clusters.push(cluster);
    }
    return new IPS(clusters);
  }
}


