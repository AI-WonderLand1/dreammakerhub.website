# Future IDE TODO — parked after launch

Status: **PARKED / NOT REQUIRED FOR LAUNCH**

DreamMakerHub's launch IDE is the lightweight browser flow already in the product:
- DreamMakerHub project file manager
- Monaco editor
- save/version history
- preview
- AI tools
- deploy flow

## Preserve for later

Do not delete the existing Coder/vCluster/Kubernetes implementation work. Keep it disabled and out of the customer launch path so it can be revisited after the core product is stable.

Future upgrade candidates:
- Coder workspace provisioning
- vCluster/Kubernetes customer compute
- persistent workspace volumes
- unrestricted terminal/runtime
- CPU/RAM/disk quotas
- workspace start/stop/reopen
- multi-user isolation verification
- compute billing / runtime metering

## Revisit only when

1. Browser editor/file workflow is stable in production.
2. Preview/deploy works reliably.
3. Customers are asking for full terminal/runtime features.
4. There is a defined compute budget and billing model.
5. Two-user isolation and quota tests can be run before enabling customer workspaces.

## Launch rule

Customer navigation must not require Coder, Kubernetes, a VM, or a Railway IDE container. Heavy IDE infrastructure stays disabled until this TODO is intentionally resumed.
