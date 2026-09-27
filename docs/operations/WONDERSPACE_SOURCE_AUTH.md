# WonderSpace repository-source authorization

WonderSpace IDEs use isolated AWS EKS customer pods, not the operator Coder account.
The source picker offers **exactly three origin families** plus the blank template:

1. **My DreamMakerHub projects**: server lists only projects belonging to the
   authenticated Supabase account. Project browsing does not yet export project
   files into customer pods.
2. **My GitHub repositories**: repository selection must use a user-authorized
   GitHub App installation limited to selected repos or a deliberately reviewed,
   least-privilege GitHub OAuth flow with the necessary repository permissions.
   **Supabase GitHub sign-in authenticates the person; it does not, by itself,
   prove that the application has durable, scoped repository-import access.**
   An assistant's GitHub connector also does not give website visitors access.
   There must be no anonymous public-repository lookup, arbitrary URL imports or
   reuse of the site's owner-wide deployment token for customer imports.
3. **Files on my computer**: a separate authenticated, size-limited ZIP/folder
   upload is required. Scan and safely extract archives; prohibit symlinks, path
   traversal, oversized archives and unapproved executable post-extraction
   hooks. No local file is uploaded without explicit action.

**Outside Git hosting providers** (if subsequently supported): require the
individual customer's provider OAuth connection where available, or their own
narrowly scoped, revocable PAT when the provider requires it. Store credentials
encrypted on the server in a user-bound credential vault with expiry/revocation,
never in URLs, browser-visible responses, GitHub Actions logs, Coder templates,
or shared environment variables. Customer-specific credentials must not be
reused for a different account's pods. Connect/import requires an explicit
user action, verified repository ownership/authorization, a pinned default or
selected branch and approved outbound network access.

Current status: only authenticated website project browsing is implemented.
GitHub is shown as **connection pending**, and local upload is labeled
unavailable. The public GitHub repository preview endpoint has been removed.
The customer creation gate remains disabled independently until AWS identity,
pod/PVC isolation and an enforced account-wide compute hard stop pass staging.

**GitHub repository visibility** is configured in GitHub's repository settings,
not by the WonderSpace source picker. Making a repository private is a separate
operation and must be checked against existing Railway/GitHub integrations.
