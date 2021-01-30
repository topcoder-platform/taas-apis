#!/bin/bash

if [ $# -eq 2 ]; then
  echo "Waiting for $2 to exit...."
  while ping -c1 $2 &>/dev/null
    do
      sleep 1
    done
  echo "$2 exited!"
fi

tail -n+3 /etc/hosts > /tmp/hosts && cp /tmp/hosts /etc/hosts # remove default localhost
cd /opt/app/ && npm run $1
