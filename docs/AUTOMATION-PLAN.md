# Automation plan — controlled autonomy

## Current automation included

- GitHub Actions CI on pushes and pull requests to `main`.
- Node.js 22 validation: typecheck, Vitest, and build.
- Build artifact retention for 7 days.
- Dependabot weekly checks for npm packages and GitHub Actions.
- Issue forms and pull-request checklist.
- Security and contribution policies.

## Not automated yet

- Repository creation/push: requires the owner's GitHub connection and repository selection.
- Deployment: no hosting provider/account has been selected or authorized.
- Production secrets: must be entered in the hosting provider's secret manager by the owner; never committed to GitHub.
- Live Discord tests: require a test bot token stored only as a protected secret and a test guild ID.
- Always-on runtime: GitHub Actions is not a persistent bot host.

## Approval gates

Owner approval is required before:
- Making a repository public or changing visibility.
- Granting new external app permissions.
- Adding production secrets or changing token scopes.
- Deploying to the primary Discord server.
- Enabling message-content collection or expanding personal-data retention.
- Adding paid hosting, databases, domains, or other billable services.
- Changing moderation policy or adding punitive actions.

## Release gates

A release cannot be marked ready until CI passes, the test guild passes manual acceptance, backups are restorable, and the rollback procedure is documented.
