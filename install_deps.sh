#!/bin/bash

# Unset NPM_CONFIG_PREFIX to allow nvm to work correctly
unset NPM_CONFIG_PREFIX

# Source nvm
. "/home/user/.nvm/nvm.sh" --no-use

# Install and use the latest Node.js version 20
nvm install 20
nvm use 20

# Install dependencies
npm install --legacy-peer-deps
