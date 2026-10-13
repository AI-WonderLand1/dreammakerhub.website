# Alice shared-training consent — v2026-10-13-v1

> Draft for legal and privacy review. Do not enable collection or training until the
> implementation, consent flows, data-use procedures, and this text are approved.

## Exact opt-in checkbox text (signup and Settings)

I choose to allow AI WONDERLAND to use my submitted prompts, project content, generated code, and feedback to evaluate and improve Alice, create reusable examples, and train future AI models. This is optional, and I may withdraw permission later in Privacy & Data settings.

## Consent semantics

- Consent is **OFF by default**; a missing preference is a refusal for shared training.
- Consent applies only to owned, authorized content and does not override project privacy, third-party licenses, statutory rights, or project-level restrictions.
- The user may withdraw in `/settings/privacy`; new ingestion must immediately stop.
- A service-role-only database check requires current opt-in and confirmed email, but additional authorization, project-level permissions, content scanning, and licensed-source checks must be enforced by a future Librarian.
- Customer content is **not** automatically collected into shared TeraBox storage or training datasets by the consent interface.
- Historical collected materials and any previously trained models require a reviewed deletion process. Never claim guaranteed retroactive unlearning.
- Email signup preserves the explicit opt-in selection in signup metadata; a database trigger snapshots a versioned audited preference on account creation. OAuth signups must opt in later through Settings.
- Consent text revisions need a **new consent version** and user re-consent; do not repurpose v2026-10-13-v1.
- The `ai_training_consent_events` append-only audit table is private. Do not expose any events to other users.

## Verification checklist before merge

1. Confirm legal policy wording, current providers, retention, deletion contact, lawful basis, and age restrictions.
2. Apply SQL migration to staging; confirm SQL policies and GRANTs.
3. Test anonymous and authenticated API calls, CSRF, JSON, opt-in, withdrawal, and database failures.
4. Confirm new user opt-in persists through email verification, while OAuth and legacy users default to opt-out.
5. Confirm no worker/AI job writes any customer content to shared knowledge without fresh consent and proper per-project authorization.
