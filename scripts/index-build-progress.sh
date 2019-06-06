#!/bin/bash

RED=$(tput setaf 1)
GREEN=$(tput setaf 2)
NORMAL=$(tput sgr0)
INDEX=0
for IP_ADDRESS in "$@"
do
  ((INDEX++))
  IS_COMPLETE="$(ssh -q -o StrictHostKeyChecking=no -t ubuntu@${IP_ADDRESS} 'cat /var/log/syslog' | grep 'Completed indexing successfully block range')"
  FAILED="$(ssh -q -o StrictHostKeyChecking=no -t ubuntu@${IP_ADDRESS} 'cat /var/log/syslog' | grep 'Finished indexing with errors. Please review the effected block ranges that encountered errors.')"

  if [ ! -z "$IS_COMPLETE" ]; then
    echo ">>> ${INDEX}. ${GREEN}✔ ${IP_ADDRESS} has completed indexing successfully${NORMAL}"
  elif [ ! -z "${FAILED}" ]; then
    echo ">>> ${INDEX}. ${RED}x ${IP_ADDRESS} has failed indexing.${NORMAL}"
  else
    echo ">>> ${INDEX}. ${IP_ADDRESS} has not yet completed indexing."
  fi
done