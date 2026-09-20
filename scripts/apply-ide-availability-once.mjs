import { readFileSync, writeFileSync } from 'node:fs';

function replaceOnce(path, before, after) {
  const source = readFileSync(path, 'utf8');
  const at = source.indexOf(before);
  if (at === -1 || source.indexOf(before, at + 1) !== -1) {
    throw new Error(`Expected a unique integration point in ${path}: ${before.slice(0, 70)}`);
  }
  writeFileSync(path, source.slice(0, at) + after + source.slice(at + before.length));
}

const dashboard = 'apps/web/app/(workspace)/dashboard/page.tsx';
const launcher = 'apps/web/components/engines/WonderSpaceLaunch.tsx';

replaceOnce(dashboard,
  'import ProjectDeleteButton from "./components/ProjectDeleteButton";\n',
  'import ProjectDeleteButton from "./components/ProjectDeleteButton";\nimport CoderAvailabilityIndicator from "@/components/engines/CoderAvailabilityIndicator";\n');
replaceOnce(dashboard,
  '              ] as const).map(([value, label, Icon]) => (\n                <button',
  '              ] as const).map(([value, label, Icon]) => {\n                const option = (\n                <button');
replaceOnce(dashboard,
  '                  <Icon size={17} /> {label}\n                </button>\n              ))}',
  '                  <Icon size={17} /> {label}\n                </button>\n                );\n                return value === "workspace" ? <CoderAvailabilityIndicator key={value}>{option}</CoderAvailabilityIndicator> : option;\n              })}');
replaceOnce(dashboard,
  '                          <Link href={toolAction.href} className="truncate rounded-md border border-white/10 px-2 py-2 text-center text-xs hover:bg-white/5">{toolAction.label}</Link>',
  '                          {["workspace", "code"].includes(normalizedType(type)) ? (\n                            <CoderAvailabilityIndicator>\n                              <Link href={toolAction.href} className="block truncate rounded-md border border-white/10 px-2 py-2 text-center text-xs hover:bg-white/5">{toolAction.label}</Link>\n                            </CoderAvailabilityIndicator>\n                          ) : (\n                            <Link href={toolAction.href} className="truncate rounded-md border border-white/10 px-2 py-2 text-center text-xs hover:bg-white/5">{toolAction.label}</Link>\n                          )}');
replaceOnce(launcher,
  "import { useAuth } from '@/lib/supabase/auth-context';\n",
  "import { useAuth } from '@/lib/supabase/auth-context';\nimport CoderAvailabilityIndicator from './CoderAvailabilityIndicator';\n");
const launcherSource = readFileSync(launcher, 'utf8');
const marker = '<button type="submit" disabled={!name || !cpu || !memory || (mode === \'repo\' && !verified)}';
const start = launcherSource.indexOf(marker);
if (start < 0 || launcherSource.indexOf(marker, start + 1) !== -1) throw new Error('Launch button integration point not found uniquely');
const end = launcherSource.indexOf('</button>', start);
if (end < 0) throw new Error('Launch button close missing');
writeFileSync(launcher,
  launcherSource.slice(0, start) + '<CoderAvailabilityIndicator>\n                  ' +
  launcherSource.slice(start, end + '</button>'.length) +
  '\n                </CoderAvailabilityIndicator>' + launcherSource.slice(end + '</button>'.length));
console.log('IDE availability indicator wired to Code / IDE choice, project IDE links, and the workspace launch button.');
