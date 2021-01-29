#!/bin/bash

set -o errexit -o nounset -o pipefail

npm install

npm run compile

mkdir -p room-1
SSM_PATH=/mux/lca2021/room-1 OUTPUT_DIR=room-1 npm start

mkdir -p room-2
SSM_PATH=/mux/lca2021/room-2 OUTPUT_DIR=room-2 npm start

mkdir -p room-3
SSM_PATH=/mux/lca2021/room-2 OUTPUT_DIR=room-3 npm start

mkdir -p room-4
SSM_PATH=/mux/lca2021/room-2 OUTPUT_DIR=room-4 npm start