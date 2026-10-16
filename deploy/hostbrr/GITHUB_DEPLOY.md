# GitHub Actions to HostBrr: approved website releases

This deployment workflow is **manual**. Merging it changes no production
containers, DNS records, WordPress settings, Stripe settings, or other repos.
Only the website image is updated when you explicitly run a release.

## Once-only SSH setup from Linux Mint

Make a NEW deployment key, separate from the current root login key:

    ssh-keygen -t ed25519 -N '' -f ~/.ssh/ai_wonderland_github_deploy -C 'github-hostbrr-deploy'

Authorize the new *public* key for the existing HostBrr user, wonderland:

    cat ~/.ssh/ai_wonderland_github_deploy.pub |
      ssh -i ~/.ssh/ai_wonderland_hostbrr root@89.106.73.109 \
        'install -d -o wonderland -g wonderland -m 700 /home/wonderland/.ssh &&
         touch /home/wonderland/.ssh/authorized_keys &&
         cat >> /home/wonderland/.ssh/authorized_keys &&
         chown wonderland:wonderland /home/wonderland/.ssh/authorized_keys &&
         chmod 600 /home/wonderland/.ssh/authorized_keys'

Check that the new key logs into the deployment account:

    ssh -i ~/.ssh/ai_wonderland_github_deploy -o IdentitiesOnly=yes \
      -o PasswordAuthentication=no wonderland@89.106.73.109 'whoami && docker version'

Docker group access is root-equivalent: keep the key safe and never reuse
the laptop's existing root private key in GitHub Actions.

## Pin the server's SSH host key

Independently check the server fingerprint through its HostBrr VNC console:

    ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub

On Linux Mint, collect the public SSH host key:

    ssh-keyscan -t ed25519 89.106.73.109 > ~/.ssh/hostbrr_known_hosts
    ssh-keygen -lf ~/.ssh/hostbrr_known_hosts

The fingerprints **must match** before trusting the collected host key.

## GitHub setup and each deployment

In repository AI-WonderLand1/dreammakerhub.website:

1. Settings > Environments: create hostbrr-production. Configure required
   reviewers and restrict permitted deployment branches to Master.
2. Add these secrets to that environment (or repository Actions secrets):
   - HOSTBRR_DEPLOY_KEY: all text from your private
     ~/.ssh/ai_wonderland_github_deploy file, including the BEGIN/END lines.
   - HOSTBRR_KNOWN_HOSTS: the verified public host-key line from
     ~/.ssh/hostbrr_known_hosts.
   Never paste either private key into chat or GitHub repository files.
3. Merge the reviewed PR containing the workflow into Master.
4. Merge a website change into Master. GitHub builds a Docker image with
   Build & Push Web Image; wait for a successful run. Copy the full 40
   character run head SHA.
5. Actions > Deploy DreamMakerHub to HostBrr > Run workflow; choose Master,
   paste the built SHA, then approve the production environment deployment.

The job checks that the build was successful on Master, then SSHes into
wonderland@89.106.73.109, using the stored host key. On the VPS it pulls
that precise Docker image, updates deployment.env, and calls the existing
deploy.sh. It checks HTTP health and the expected build response header.
If checks fail it tries to restore the previous pinned image.

This job does not change Caddy, Cloudflare DNS, runtime.env, or databases.
It does not start Playground, NPC, GPU or Coder workloads.

## Recovery

On HostBrr, inspect the current image and containers without displaying
private environment variables:

    cd ~/hostbrr-web-staging/deploy/hostbrr
    grep '^WEB_IMAGE=' deployment.env
    docker compose --env-file deployment.env -f compose.yaml -f compose.public.yaml ps
    curl -fsSI http://127.0.0.1:5001/

For manual rollback, put the last verified 40-character image SHA into
deployment.env and run bash deploy.sh. Never run docker compose down -v.

A deployment key can be revoked by deleting its authorized_keys entry on
HostBrr and removing HOSTBRR_DEPLOY_KEY from GitHub.
