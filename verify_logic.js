#!/usr/bin/env node
const { readFileSync, existsSync } = require('node:fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const components = JSON.parse(readFileSync('apps/web/components.json', 'utf8'));

assert(typeof components.registries === 'object' && components.registries !== null, 'registries must be an object');
assert(!Array.isArray(components.registries), 'registries must not be an array');
assert(
  components.registries['@shadcn'] === 'https://ui.shadcn.com/r/{name}.json',
  'registries.@shadcn must point to https://ui.shadcn.com/r/{name}.json'
);

console.log('verify_logic.js: registry alias configuration looks correct.');

assert(existsSync('apps/web/app/(workspace)/dashboard/editor-playcanvas/page.tsx'), 'PlayCanvas bridge route must exist');
assert(existsSync('apps/web/app/wonderspace/page.tsx'), 'WonderSpace guide route must exist');

const homepageNav = readFileSync('ui/components/homepage/Navigation.tsx', 'utf8');
assert(homepageNav.includes("href: '/wonderspace'"), 'Homepage nav must include /wonderspace link');
assert(homepageNav.includes("/dashboard/editor-playcanvas"), 'Homepage nav must include dashboard PlayCanvas bridge link');

const bridgePage = readFileSync('apps/web/app/(workspace)/dashboard/editor-playcanvas/page.tsx', 'utf8');
assert(bridgePage.includes('Theia Handoff'), 'Bridge page must expose Theia handoff guidance');
assert(bridgePage.includes('Open WonderSpace Guide'), 'Bridge page must link to WonderSpace guide');

console.log('verify_logic.js: playcanvas + wonderspace bridge checks passed.');
