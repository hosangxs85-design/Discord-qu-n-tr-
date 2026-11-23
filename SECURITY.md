# Security policy

## Reporting a vulnerability

Do not publish bot tokens, credentials, private member data, or a working exploit in a public issue.

Use GitHub's **Private vulnerability reporting** / Security Advisory feature for this repository when available. If it is not enabled, contact the repository owner privately and provide a minimal reproduction without secrets.

## Security requirements

- Never commit `.env`, tokens, API keys, database files, backups, or raw private logs.
- Keep Discord permissions minimal; do not grant Administrator by default.
- Moderation remains human-reviewed. This project must not automatically ban, kick, or timeout members.
- Log only data needed for configured features and apply retention limits.
- Review dependency updates and CI results before merging.
