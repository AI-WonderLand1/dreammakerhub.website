# Project Repo Features TODO

These are future project-level surfaces inspired by the supplied reference screenshots. Keep the DreamMakerHub branding and project/workspace context. Do not copy GitHub branding, and do not add fake data or dead controls.

## Issues

- [ ] build a project-scoped Issues view
- [ ] show `All issues` heading and clear project context
- [ ] add `New issue` action
- [ ] add search/query bar with open/closed filtering
- [ ] show real Open and Closed counts
- [ ] add filters for Author, Labels, Projects, Milestones, Assignees, Types, and sort order
- [ ] add left-side filters for Assigned to me, Created by me, Mentioned, and Recent activity
- [ ] add Views, Projects, Milestones, and Labels shortcuts only when backed by real data
- [ ] add useful empty state when no issues match filters
- [ ] keep issue data scoped to the selected project/workspace
- [ ] enforce permissions for create/edit/close/assign/label actions
- [ ] do not hardcode counts, labels, users, projects, or milestones

## Pull Requests

- [ ] build a project-scoped Pull Requests view
- [ ] show `All pull requests` heading and clear project context
- [ ] add `New pull request` action
- [ ] add search/query bar for open/closed and text filtering
- [ ] show real Open and Closed counts
- [ ] add filters for Author, Label, Projects, Milestones, Reviews, Assignee, and sort order
- [ ] add left-side filters for Pull requests, Authored by me, Assigned to me, Involves me, and Review requests
- [ ] add Labels and Milestones controls only when backed by real data
- [ ] add useful empty state when no pull requests match the current search
- [ ] support project-scoped review/request state
- [ ] support real diff/review data before exposing review controls
- [ ] enforce permissions for create/update/merge/review actions
- [ ] do not hardcode PR counts, review counts, labels, milestones, or assignees

## Agent Sessions

- [ ] build a project-scoped Agent Sessions view
- [ ] show `Sessions` heading and selected project context
- [ ] add search/query bar for session filtering
- [ ] show real Active and Completed counts
- [ ] add filters for Status, Type, Agent, and sort order
- [ ] add left-side filters for Created by me and Needs attention
- [ ] add Configure and Customize environment actions only when they map to real agent/environment settings
- [ ] show real sessions created by the current user/project
- [ ] add useful empty state when no sessions match filters
- [ ] surface sessions that need attention because of failures, blocked state, or requested user input
- [ ] connect session rows to the actual agent/session detail view
- [ ] preserve workspace_id + project_id + agent/session context through navigation
- [ ] enforce permissions for starting, stopping, resuming, or configuring sessions
- [ ] do not invent agent names, statuses, session counts, or environment information

## Shared UX rules

- [ ] keep these as secondary project surfaces, not extra onboarding steps
- [ ] preserve the 3-step flow: Login → Select Project → Project Dashboard
- [ ] keep the left DreamMakerHub sidebar as platform navigation
- [ ] keep the repo-style project menu as project navigation
- [ ] all filters/search must operate on real project data
- [ ] provide clean empty states instead of sample rows
- [ ] keep mobile layouts usable with collapsible/scrollable navigation
- [ ] reuse existing auth, project ownership, workspace, realtime, and permission systems where possible
- [ ] do not create duplicate backends just to imitate the reference UI
