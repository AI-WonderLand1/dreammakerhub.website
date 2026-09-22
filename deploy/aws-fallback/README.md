# AWS fallback for the DreamMakerHub website

This is a **manual, single-VM web-only fallback**. It uses the same GitHub Container Registry image as the UpCloud website deployment, and copies the current *named* GitHub Actions secrets/variables to the VM only during an explicitly initiated deployment. It **does not** provision AWS resources, automatically fail over DNS, migrate Coder, restore databases, or change the live website. The web process binds **only** `127.0.0.1:5001` on the VM until a separately configured HTTPS reverse proxy is tested.

## Before you create a billable resource

1. Check **AWS Billing > Credits** for the usable balance, expiration and service eligibility. Set an AWS Budget with multiple email alerts, and inspect Free Tier restrictions. A budget **is not a hard spending cap**. If you upgrade to a paid account, ineligible usage or usage after credits can charge your payment method.
2. Back up UpCloud-only data before its trial ends: local user uploads, Coder's PostgreSQL volume (`coder-db-data`), workspace volumes, local TLS material if applicable, and any other host-only state. A GitHub image and a Supabase database do not contain these backups.
3. In **Lightsail**, choose an Ubuntu Linux x86_64 VM sized for the web app. The 2 GiB/$12 per month and 4 GiB/$24 per month Linux public-IPv4 bundles are possible starting points, **not a validated sizing decision**. Include additional costs for backups, outbound traffic beyond the bundle, and other AWS services. The lowest-memory plans are not suitable for the entire Coder/3D stack. Confirm that your AWS credit applies to the chosen service before purchase.
4. Record the VM public IP. Keep ports `5000` and `5001` closed in the AWS firewall. Grant SSH access only through a controlled connection. GitHub-hosted runners have changing IP ranges, so use an appropriate restricted access strategy rather than permanently opening SSH to the world. This workflow uses SSH, not an IAM access key.
5. Install Docker Engine **and its Compose plugin** from Docker's official Ubuntu instructions; start Docker and give the designated SSH user Docker permission. Membership of the `docker` group grants root-equivalent privileges: use a dedicated deploy user and avoid placing untrusted accounts in that group. Install `curl` on the host. Do not run the build on the small VM; the workflow pulls a prebuilt image.

AWS documentation: https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-bundles.html
Docker Ubuntu installation: https://docs.docker.com/engine/install/ubuntu/

## Configure GitHub without exposing keys

In the repository's **Settings > Secrets and variables > Actions**, set:

| Type | Name | Meaning |
|---|---|---|
| Variable | `AWS_FALLBACK_HOST` | Lightsail/EC2 public IPv4 or DNS name, exactly as used in known_hosts |
| Variable | `AWS_FALLBACK_USER` | Dedicated Linux deploy user, such as `ubuntu` (defaults to ubuntu) |
| Variable (optional) | `AWS_FALLBACK_PUBLIC_URL` | HTTPS hostname used by the application; defaults to `https://dreammakerhub.website`. This is **not** a staging OAuth configuration. |
| Secret | `AWS_FALLBACK_SSH_KEY` | Private SSH key authorized for that deploy user; never commit/paste it into chat |
| Secret | `AWS_FALLBACK_KNOWN_HOSTS` | Full, verified known_hosts line: `YOUR_AWS_IP ssh-ed25519 YOUR_VERIFIED_SERVER_PUBLIC_HOST_KEY` |

Verify the SSH *host key* using the AWS console's browser-based VM terminal and compare its fingerprint with your known_hosts entry. Do **not** blindly trust `ssh-keyscan` on an unverified network. SSH and host keys are different: do not put your private SSH key in known_hosts.

The workflow also requires your existing GitHub Actions Supabase URL/publishable key, service-role key, database URL, and at least one AI provider key. It transfers a matching set of optional app keys from the existing UpCloud workflow. It creates `~/dreammakerhub-fallback/runtime.env` on the VM, mode 0600, **not** in git. Verify any external service credentials have access from AWS. The GitHub Actions `GITHUB_TOKEN` needs package read permission for the GHCR image; if the container package is private, grant this repository package access.

## Build, deploy, and verify without changing live DNS

1. Confirm **Build & Push Web Image** on `Master` completed successfully; copy its 40-character commit SHA. The image tag is `ghcr.io/ai-wonderland1/dreammakerhub-website:<SHA>`.
2. After this workflow has been merged and reviewed, go to GitHub **Actions > Deploy AWS fallback web (manual only) > Run workflow**. Choose the `Master` branch and paste that *built* SHA. This workflow is not scheduled and does not run on every push.
3. The runner validates its settings, pins the SSH host key, copies the environment privately, authenticates to GHCR with its temporary GitHub token, pulls the immutable image, and runs the web container bound to VM loopback. It checks `/health`, and restores the previous fallback container if the new container does not become healthy.
4. Connect via a **local SSH tunnel** (replace the placeholder with your VM and your own private key path):

   ```bash
   ssh -i ~/.ssh/your-aws-key -L 5501:127.0.0.1:5001 ubuntu@YOUR_AWS_IP
   ```

   While that connection is open, visit `http://localhost:5501/health` and `http://localhost:5501/`. Do not treat success on `/health` as proof that sign-in, AI, file uploads, image storage, Stripe, or publishing work. An SSH tunnel hostname is not a substitute for an HTTPS staging domain when testing cookies or OAuth.
5. Before any DNS cutover, configure HTTPS ingress separately, using a trusted staging hostname, valid certificate, host firewall, and a reverse proxy pointing to `127.0.0.1:5001`. Whitelist the staging URL in the relevant authentication provider. Test the actual workflows without delivering real payment webhooks twice.
6. Only after staging passes should you manually change **website** DNS in Cloudflare, leaving Zoho mail records untouched. Keep old UpCloud service available for rollback as long as its trial allows. Avoid two active webhook receivers, job processors, or duplicate background workers. Revert the website DNS if the new origin fails.

## Explicit limitations and cost controls

- **Not automatic failover.** GitHub Actions does not detect downtime or reconfigure Cloudflare. The VM must be running to serve requests; create/test it before the UpCloud deadline.
- **Web only.** The UpCloud Compose stack separately runs Coder, Coder PostgreSQL, Nginx, certbot and the GLTF optimizer. None of these services or their data move with this web container. In particular, `coder.dreammakerhub.website` and its database/workspaces need a separate migration.
- **Secrets are copied, not synchronized forever.** Re-run the manual deployment after rotating a GitHub secret. The workflow does not read or overwrite AWS account credentials and never needs an AWS root key.
- **The image may contain build-time public configuration.** Rebuild the image on Master if public Supabase/Amplitude settings or `NEXT_PUBLIC_*` values have changed; setting a runtime value cannot alter already compiled JavaScript.
- **A stopped Lightsail VM is still billable.** Deleting it stops compute charges but destroys local state unless you have separate backups/snapshots, which themselves can cost money. Neither AWS Credits nor Budgets guarantee no card charges.
- Keep untrusted web uploads and mutable data in external stores with validated backups, not solely inside the container. The script preserves the prior *container* for deployment rollback only; it is not a data backup or DNS rollback.
