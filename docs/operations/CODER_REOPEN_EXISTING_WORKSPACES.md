# Reopen existing Coder workspaces without duplicate creation

The WonderSpace launchpad's **Create** action creates a new, separately allocated workspace. `/wonderspace/workspaces` now offers **Open existing IDE** for a verified private operator's *already allocated* Coder workspace. It never calls the create endpoint, allocates a new slot, or chooses a different workspace by name.

## Ownership and safety

- The server obtains the Supabase user from `supabase.auth.getUser()` and looks up the slot by `(user_id, slot_id)`. It will not use a caller-provided owner, workspace ID, URL, or token.
- The slot must be provisioned, have the same stored Coder API origin, and match the workspace UUID and name returned by Coder. The authenticated API token's `/api/v2/users/me` identity must match the Coder workspace owner ID and username.
- Because the configured Coder token still represents **one shared Coder identity**, this endpoint is restricted to the one allowlisted site operator. With multiple `ADMIN_USER_IDS`, configure `CODER_OPERATOR_SUPABASE_ID` as the single operator's existing Supabase Auth UUID; it must also appear in `ADMIN_USER_IDS`. This is server-only configuration, never `NEXT_PUBLIC_*`.
- Coder separately requires the operator's browser login. A website login does not authenticate the browser to Coder. The response links to the authenticated **workspace page**, where Coder provides the current IDE app link; it does not fabricate a code-server subdomain or bypass app authentication.
- A stopped workspace is restarted through `POST /api/v2/workspaces/{recorded-id}/builds` with `{ "transition": "start" }`, only when `BILLABLE_OPERATIONS_ENABLED=true`. The page polls read-only status and follows the existing workspace URL when running. Starting does not create a second workspace or a fresh PVC. The existing deletion confirmation and accounting remain unchanged.
- `reserved` and `deleting` allocations are **not** opened or silently replaced. A reserved slot after a Coder timeout requires operator reconciliation.

## Not implemented or enabled

This PR does **not** configure AWS/Kubernetes, publish a Coder template, map individual DreamMakerHub customers to separate Coder identities, enforce cumulative usage time, change billing settings, or deploy the site. Customer IDE creation and opening are still paused. The operator's manually created `wonderingtribe/production` IDE may not be listed in the website's allocation table; the separate owner-only link in PR #535 addresses that particular workspace.

## Verify after review and deployment

1. With the authenticated site operator, create **one test IDE through DreamMakerHub** (not from Coder's dashboard). Record its Coder workspace UUID and volume contents.
2. Visit `/wonderspace/workspaces`, click **Open existing IDE**; confirm the same UUID and unchanged workspace count. Sign into Coder as the operator if prompted, then click the code-server app.
3. Stop that test workspace in Coder. Click **Open existing IDE** on the website; confirm the same UUID restarts, and the saved file is still present. Verify the `BILLABLE_OPERATIONS_ENABLED=false` switch blocks restarting.
4. Sign in as a different Supabase user and check that no operator workspace link or workspace ID is exposed and no Coder API request is sent. Do not try to share the operator's Coder account or token.
5. Run CI and verify both website and Coder deployments; this source patch alone is not a production test.

Rollback: revert the PR; do not delete Coder workspaces or their persistent volumes merely to roll back the navigation feature.
