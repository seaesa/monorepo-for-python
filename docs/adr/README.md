# Architecture decision records

One file per decision that is expensive to reverse or that a newcomer would otherwise question.
Write one **before** changing such a decision, not after.

- File: `NNNN-short-title.md` (next free number). Never rewrite an accepted ADR; supersede it with a
  new one and set the old one's status to `Superseded by NNNN`.
- Keep it short: context, decision, consequences. Link it from the code or doc it governs.

| ADR                                     | Decision                                                                            |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| [0001](0001-openapi-is-the-contract.md) | The backend OpenAPI schema is the only contract; clients are generated              |
| [0002](0002-configuration.md)           | Configuration comes from the environment, validated at startup, no defaults in code |
| [0003](0003-api-versioning.md)          | API evolves additively under `/api/v1`; breaking changes are gated                  |
| [0004](0004-access-control.md)          | Permission-based access control with roles mapped in code                           |

Template:

```md
# NNNN. Title

Status: Proposed | Accepted | Superseded by NNNN · Date: YYYY-MM-DD

## Context

What forces are at play; what problem needs a decision.

## Decision

What we do, stated as a rule.

## Consequences

What gets easier, what gets harder, what we must keep doing.
```
