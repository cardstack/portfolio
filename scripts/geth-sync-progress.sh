#!/bin/bash

if [ -z "$(which jq)" ]; then
  echo "This script relies on jq. Please install it first. https://stedolan.github.io/jq"
  exit 1;
fi

RED=$(tput setaf 1)
GREEN=$(tput setaf 2)
NORMAL=$(tput sgr0)
INDEX=0
for IP_ADDRESS in "$@"
do
  ((INDEX++))
  SYNC_STATUS="$(curl -s -X POST -H "Content-Type:application/json" --data '{"jsonrpc":"2.0","method":"eth_syncing","params":[],"id":1}' http://${IP_ADDRESS}:8545)"

  if [ -z "$SYNC_STATUS" ]; then
    printf "${RED}>>> %2d. %-15s does not appear to be running geth.${NORMAL}\n" $INDEX $IP_ADDRESS
  else
    if [ "$(echo $SYNC_STATUS | jq '.result')" = "false" ]; then
      printf "${GREEN}>>> %2d. %-15s ✔  has completed syncing.${NORMAL}\n" $INDEX $IP_ADDRESS
    else
      CURRENT_BLOCK_HEX=$(echo "$SYNC_STATUS" | jq -r '.result.currentBlock')
      HIGHEST_BLOCK_HEX=$(echo "$SYNC_STATUS" | jq -r '.result.highestBlock')
      KNOWN_STATES_HEX=$(echo "$SYNC_STATUS" | jq -r '.result.knownStates')
      PULLED_STATES_HEX=$(echo "$SYNC_STATUS" | jq -r '.result.pulledStates')

      printf ">>> %2d. %-15s is syncing,  current block:%'11d   highest block:%'11d   known states:%'12d   pulled states:%'12d\n" $INDEX $IP_ADDRESS $CURRENT_BLOCK_HEX $HIGHEST_BLOCK_HEX $KNOWN_STATES_HEX $PULLED_STATES_HEX
    fi
  fi
done