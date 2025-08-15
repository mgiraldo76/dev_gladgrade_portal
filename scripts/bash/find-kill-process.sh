#!/bin/bash

read -p "🤓 Enter port: " port

while true; do
  output=$(lsof -i :$port)
  if [ -z "$output" ]; then
    echo "☹️ No processes on port $port."
    break
  fi
  echo "$output"
  read -p "☠️ Kill any? (y/n): " choice
  if [ "$choice" != "y" ]; then
    break
  fi
  read -p "🤓 Enter PID: " pid
  kill -9 $pid
done