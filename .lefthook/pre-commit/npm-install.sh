#!/bin/bash

# Check for internet connectivity before running npm install
if nc -zw1 8.8.8.8 53 > /dev/null 2>&1 || nc -zw1 google.com 443 > /dev/null 2>&1; then
  npm install
else
  echo "No internet connection detected. Skipping npm install."
fi
