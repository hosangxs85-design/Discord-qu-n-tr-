# Contributing

1. Create a feature branch; do not commit directly to `main`.
2. Keep changes within `docs/spec/` and the approved project scope.
3. Run `npm run typecheck`, `npm test`, and `npm run build`.
4. Add tests for permission checks, guild isolation, idempotency, and data handling where relevant.
5. Never add secrets, real member data, database files, or unredacted logs.
6. Open a pull request and complete `.github/pull_request_template.md`.

Changes that alter privacy defaults, Discord permissions, moderation policy, database retention, or deployment spend require owner approval.
