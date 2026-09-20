import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// One-time migration. Preserve every source TODO verbatim before deleting duplicates.
const sources = [
  ['TODO.md', 'WonderBuild', 'wonderbuild'],
  ['TODO_NPC_3D_PREVIEW.md', 'NPC 3D preview', 'npc-3d-preview'],
  ['docs/DASHBOARD_COMMAND_CENTER_TODO.md', 'Dashboard command center', 'dashboard-command-center'],
  ['docs/PROJECT_REPO_FEATURES_TODO.md', 'Project/repository features', 'project-repository-features'],
  ['docs/TODO-WONDER-CLI-DASHBOARD-SYNC.md', 'Wonder CLI/dashboard synchronization', 'wonder-cli-dashboard-sync'],
  ['docs/WONDERPLAY_PLAYER_RUNTIME_TODO.md', 'WonderPlay player runtime', 'wonderplay-player-runtime'],
];
const referenceImages = [
  'docs/reference/wonderplay-editor-design-concept.webp',
  'docs/reference/wonderplay-dashboard-sidebar-before.webp',
];
for (const [path] of sources) if (!existsSync(path)) throw Error(`Missing source TODO: ${path}`);
for (const path of referenceImages) if (!existsSync(path)) throw Error(`Missing reference image: ${path}`);
const originals = sources.map(([path, label, anchor]) => ({
  path, label, anchor, content: readFileSync(path, 'utf8').trimEnd(),
}));
for (const { path, content } of originals) {
  if (!content || !/^#\s/m.test(content)) throw Error(`Invalid TODO: ${path}`);
}

const intro = `# DreamMakerHub master TODO

> One task file for the main repository, consolidated September 20, 2026. Old unchecked boxes do not prove an issue is still open: verify against current code and a real browser before marking anything complete. All six source TODOs are preserved verbatim below. New tasks belong here, not in new TODO files.

## Fix what's not working first

- [ ] **WonderPlay engine:** reproduce and resolve the actual \`E.Entity is not a constructor\` error before claiming the 3D viewport works. Verify PlayCanvas imports and initialization in a browser.
- [ ] **Project load (500):** reproduce with an authenticated real project; fix underlying storage/auth error and test save, reopen, and project isolation. Never fabricate a default project to hide the error.
- [ ] **One-page WonderPlay:** keep the Outliner, real PlayCanvas viewport, Details/AI controls, bottom Content Browser, 360 View, Game Builder and Movie Maker on the single \`/dashboard/3dhub\` route. No extra wizard or project re-selection.
- [ ] **Canvas space:** verify the normal dashboard sidebar/header are hidden only inside WonderPlay and the compact top Navigate menu works by mouse, keyboard and on mobile. [Navigation PR #502](https://github.com/AI-WonderLand1/dreammakerhub.website/pull/502) was merged; deployment/browser behavior still needs checking.
- [ ] **Real Outliner and inspector:** list actual scene objects, selection, transforms, lights/materials and gizmos rather than only project files. Real asset thumbnails belong in the bottom browser.
- [ ] **Graphics:** add PBR materials, lighting, shadows, reflection choices, selection outline, grid and Low/Balanced/High settings to the existing PlayCanvas renderer. A Unity-inspired visual style does not mean installing Unity.
- [ ] **Authentic homepage imagery:** replace schematic/random images with genuine screenshots of working product surfaces. Do not use screenshots with visible errors as successful product demonstrations.
- [ ] **WonderBuild:** verify template fidelity, nested drag/drop, graphics rendering, AI assistant, project persistence, live Preview and Publish in a real browser. Keep Start → Build (+ Preview) → Publish.
- [ ] **WonderSpace:** validate Coder login, workspace launch, files, terminal, persistence and per-user isolation, rather than assuming mockup imagery proves IDE readiness.
- [ ] **Hosting safety:** back up any UpCloud-only files and test an AWS fallback without changing live DNS or starting resources through this TODO update.
- [ ] **Release gate:** test build, authenticated flows and mobile/desktop layouts; distinguish CI success from deployment and actual runtime success.

## WonderPlay image references

**Target concept, AI-generated illustration, not a screenshot of implemented functionality:**

![Unity-inspired WonderPlay editor concept](docs/reference/wonderplay-editor-design-concept.webp)

**Existing full-height dashboard sidebar, provided screenshot. It must not occupy permanent canvas width in WonderPlay:**

![Dashboard sidebar to replace with compact top navigation](docs/reference/wonderplay-dashboard-sidebar-before.webp)

Target: top navigation, scene Outliner at left, large unobstructed viewport, Details at right, and Content Browser below, all on one page. The references are layout goals, not proof these features work.

## Historical task lists, consolidated without dropping checkboxes

All original wording and checkboxes follow. Some are older aspirations or completed work; confirm status before changing them.
`;
const contents = originals.map(({ path, label, anchor, content }) => `\n---\n\n<a id="${anchor}"></a>\n## Imported from \`${path}\`: ${label}\n\n${content}\n`).join('\n');
const consolidated = intro + contents;
for (const { path, content } of originals) {
  if (!consolidated.includes(content)) throw Error(`Source text lost: ${path}`);
}
writeFileSync('TODO.md', consolidated);
for (const { path } of originals.slice(1)) unlinkSync(path);

// Repair Markdown links in retained docs while leaving prose and historical excerpts unchanged.
const tracked = execFileSync('git', ['ls-files', '-z', '--', '*.md', '*.mdx'], { encoding: 'utf8' }).split('\0').filter(Boolean);
for (const file of tracked) {
  if (file === 'TODO.md' || !existsSync(file)) continue;
  let body = readFileSync(file, 'utf8');
  const before = body;
  const replacementPrefix = '../'.repeat(file.split('/').length - 1);
  for (const { path, anchor } of originals.slice(1)) {
    const replacement = `](${replacementPrefix}TODO.md#${anchor})`;
    for (const old of [path, `./${path}`, `../${path}`, path.split('/').at(-1), `./${path.split('/').at(-1)}`, `../${path.split('/').at(-1)}`]) {
      body = body.replaceAll(`](${old})`, replacement);
    }
  }
  if (body !== before) writeFileSync(file, body);
}
console.log(`Combined ${sources.length} source TODOs, ${Buffer.byteLength(consolidated)} bytes; retained the two reference images.`);
