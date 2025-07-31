#!/bin/sh
# wait-for-kafka.sh
set -e

hostport="$1"
shift
cmd="$@"

# Split host and port
host=$(echo $hostport | cut -d: -f1)
port=$(echo $hostport | cut -d: -f2)

echo "Waiting for Kafka at $host:$port"
until nc -z $host $port; do
  >&2 echo "Kafka is unavailable - sleeping"
  sleep 2
done

>&2 echo "Kafka is up - executing command"
exec $cmd