# ips-patcher [![npm version](https://badge.fury.io/js/ips-patcher.svg)](https://badge.fury.io/js/ips-patcher)
Parse and Apply IPS binary patch format for JavaScript.

- [IPS format](https://zerosoft.zophar.net/ips.php)

## Use from Command-Line
### Install
```
npm install -g ips-patcher
```

### Command Example
The following is an brief example to apply patch.ips to target.bin. 
The result will be written to output.bin.

```
ips-patcher -p patch.ips -o output.bin target.bin
```

### Command Usage
```
ips-patcher

  Apply IPS patch to binary image. 

SYNOPSIS

  ips-patcher [<option>] <image> 

OPTIONS

  -t, --target file   Specify target image file to be patched.               
  -p, --patch file    Specify IPS patch file to use.                         
  -o, --output file   Specify output file. ./patched.bin is used by default. 
  -v, --version       Show version.                                          
  -h, --help          Show this help. 
```

## Use as Library
### Install
```
npm install --save ips-patcher
```

### Code Example
```
const fs = require('fs');
const { IPSParser } = require('ips-patcher');

function toArrayBuffer(b) {
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

const patch = fs.readFileSync('patch.ips');
const parser = new IPSParser();
const ips = parser.parseIPS(toArrayBuffer(patch));

const target = fs.readFileSync('target.bin');
const result = ips.applyTo(toArrayBuffer(target));

fs.writeFileSync('patched.bin', result);
```
