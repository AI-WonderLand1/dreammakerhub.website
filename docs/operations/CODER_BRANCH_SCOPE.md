# Customer Coder IDE source fix scope

This branch adds an early authenticated operator gate to the existing shared-owner Coder workspace provisioning route, a source-level regression check, and AWS/Kubernetes rollout review docs. It does not change the existing operator's Coder workspace, Coder dashboard, cluster, database, or any production credentials. No live Coder API call or paid AWS infrastructure deployment was made. Customer provisioning remains disabled pending separate Coder identities, runtime enforcement and two-account isolation testing.
