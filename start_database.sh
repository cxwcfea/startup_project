while true; do
  killall mongod
  mongod -dbpath data --rest --bind_ip 127.0.0.1
done
