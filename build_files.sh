#!/bin/bash
echo "=== COMPILING FRONTEND ==="
cd frontend
npm install
npm run build
cd ..

echo "=== PREPARING STATIC ASSETS ==="
mkdir -p static_output
cp -r frontend/dist/* static_output/

echo "=== BUILD PROCESS COMPLETED 100% ==="