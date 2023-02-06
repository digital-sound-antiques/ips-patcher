"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const command_line_args_1 = __importDefault(require("command-line-args"));
const command_line_usage_1 = __importDefault(require("command-line-usage"));
const shasum_1 = __importDefault(require("shasum"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_1 = require("./index");
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
        description: "Specify output file. ./patched.bin is used by default.",
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
function toArrayBuffer(b) {
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}
function main(argv) {
    const options = (0, command_line_args_1.default)(optionDefinitions, { argv });
    if (options.help) {
        console.error((0, command_line_usage_1.default)(optionSections));
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
        patch = fs_1.default.readFileSync(options.patch);
        console.log(`${path_1.default.basename(options.patch)}\t${(0, shasum_1.default)(patch)}\t${patch.byteLength} bytes`);
    }
    catch (e) {
        console.error(e.message);
        return 1;
    }
    let ips;
    try {
        const parser = new index_1.IPSParser();
        ips = parser.parseIPS(toArrayBuffer(patch));
    }
    catch (e) {
        console.error(`Failed to parse ${options.patch}`);
        console.error(e.message);
        return 1;
    }
    let target;
    try {
        target = fs_1.default.readFileSync(options.target);
        console.log(`${path_1.default.basename(options.target)}\t${(0, shasum_1.default)(target)}\t${target.byteLength} bytes`);
    }
    catch (e) {
        console.error(e.message);
        return 1;
    }
    let result;
    try {
        result = ips.applyTo(toArrayBuffer(target));
    }
    catch (e) {
        console.error(e.message);
        return 1;
    }
    try {
        let output = options.output;
        fs_1.default.writeFileSync(output, result);
        let buffer = fs_1.default.readFileSync(output);
        console.log(`${output}\t${(0, shasum_1.default)(buffer)}\t${buffer.byteLength} bytes`);
    }
    catch (e) {
        console.error(e.message);
        return 1;
    }
}
main(process.argv);
