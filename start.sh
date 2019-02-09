#!/bin/bash

./node_modules/sass/sass.js ./scss/_main.scss ./scss/_all.css

#
# This is a hack because the bitcoinjs library (used by Blockstack) expects the crypto
# package to have a hash function called "rmd160", however the crypto package you get when
# doing require("crypto") in Electron refers to that hash function only as "ripemd160".
#
sed -i.bak 's/rmd160/ripemd160/g' ./node_modules/bitcoinjs-lib/src/crypto.js

electron --inspect .
