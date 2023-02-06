import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import shasum from "shasum";
import fs from "fs";
import path from "path";
import { IPSParser, IPS } from './index';

const optionDefinitions = [
  {
    name: "target",
    alias: "t",
    typeLabel: "{underline file}",
    defaultOption: true,
    description: "Specify target image file to be patched."
  },
  {
    name: "patch",
    alias: "p",
    typeLabel: "{underline file}",
    description: "Specify IPS patch file to use.",
    type: String,
  },
  {
    name: "output",
    alias: "o",
    typeLabel: "{underline file}",
    description:
      "Specify output file. ./patched.bin is used by default.",
    defaultValue: 'patched.bin',
    type: String
  },
  {
    name: "version",
    alias: "v",
    description: "Show version.",
    type: Boolean
  },
  {
    name: "help",
    alias: "h",
    description: "Show this help.",
    type: Boolean
  }
];

const optionSections = [
  {
    header: "ips-patcher",
    content: "Apply IPS patch to binary image."
  },
  {
    header: "SYNOPSIS",
    content: ["{underline ips-patcher} [<option>] <image>"]
  },
  {
    header: "OPTIONS",
    optionList: optionDefinitions
  },
];

function toArrayBuffer(b: Buffer) {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

function main(argv: string[]) {
  const options = commandLineArgs(optionDefinitions, { argv });

  if (options.help) {
    console.error(commandLineUsage(optionSections));
    return 1;
  }

  if (options.version) {
    const json = require("../package.json");
    console.info(json.version);
    return 0;
  }

  if (options.patch == null) {
    console.error('IPS patch file is not specified. Use --help option to show help.');
    return 1;
  }

  if (options.target == null) {
    console.error('Target image file is not specified. Use --help option to show help.');
    return 1;
  }

  let patch;
  try {
    patch = fs.readFileSync(options.patch);
    console.log(`${path.basename(options.patch)}\t${shasum(patch)}\t${patch.byteLength} bytes`);
  } catch (e: any) {
    console.error(e.message);
    return 1;
  }

  let ips: IPS;
  try {
    const parser = new IPSParser();
    ips = parser.parseIPS(toArrayBuffer(patch));
  } catch (e: any) {
    console.error(`Failed to parse ${options.patch}`);
    console.error(e.message);
    return 1;
  }

  let target: Buffer;
  try {
    target = fs.readFileSync(options.target);
    console.log(`${path.basename(options.target)}\t${shasum(target)}\t${target.byteLength} bytes`);
  } catch (e: any) {
    console.error(e.message);
    return 1;
  }

  let result: Uint8Array;
  try {
    result = ips.applyTo(toArrayBuffer(target));
  } catch (e: any) {
    console.error(e.message);
    return 1;
  }

  try {
    let output: string = options.output;
    fs.writeFileSync(output, result);
    let buffer = fs.readFileSync(output);
    console.log(`${output}\t${shasum(buffer)}\t${buffer.byteLength} bytes`);
  } catch (e: any) {
    console.error(e.message);
    return 1;
  }
}

main(process.argv);