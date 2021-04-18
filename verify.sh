#!/bin/bash

contracts=(CheckToken
ForkToken
IDFO
MockDai
MockWBNB
UniswapV2Factory
UniswapV2Router02)

function verify() {
    network=$1
    echo "----------------------------------------------------------"
    for c in ${contracts[@]} ; do
        echo  "Executing command: truffle run verify ${c} --network ${network}"
        truffle run verify ${c} --network ${network}
    done
    echo "----------------------------------------------------------"
}

if [ -n "$1" ]; then
    verify $1
else
    exit 0
fi
