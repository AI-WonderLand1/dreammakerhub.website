# WonderBuild Swarm Execution Plan

This plan is the merge-safe orchestration document for parallel workers.

## Master schema
- Canonical file: `docs/blueprints/master-schema.json`
- All workers MUST load this schema before executing.
- Workers are forbidden from changing the top-level state keys.

## Worker assignments

### Worker A — Foundation
- Setup global state/provider contracts.
- Stabilize API type contracts for:
  - `/api/projects`
  - `/api/projects/[projectId]/publish`
  - `/api/projects/[projectId]/snapshots`
  - `/api/wonder-sync/pull`
- Add shared error/empty/loading status enums.

### Worker B — Visuals
- Apply universal header contract on touched pages:
  `[Breadcrumb/Back] -> [Title] -> [Subtitle] -> [Primary Action]`
- Ensure each interactive element has clear `aria-label` and visible focus treatment.
- Mirror trust layer in UI with loading skeletons, empty state CTA, and non-blocking error toast.

### Worker C — Logic
- Enforce deterministic `WonderBuildState` parsing and validation.
- Keep renderer mapping typed for `hero|features|footer` blocks.
- Add rollback and retry logic whenever AI output is invalid.
- Keep git operation actions deterministic with status transitions.

### Worker D — Assets
- Define media placeholders and interface for real asset injection.
- Provide fallback copy/icons/illustration slots for empty and error states.
- Keep route integrity map and link target verification list.

## Inter-agent protocol
1. Workers can only implement within assigned scope.
2. Workers cannot change global state shape.
3. Naming convention is fixed:
   - Components: `DomainEntityPanel`
   - State keys: `state.domain.entity.field`
   - APIs: `/api/<domain>/<resource>`
4. Merge requires contract checks to pass.

## Parallel dispatch model
Use `Promise.all` to schedule workers concurrently after loading the master schema.
