---
description: Create a linear ticket using mcp tool.
---

# Legend

- [ECOSYSTEM] - EVM, Stellar etc.
- [TYPE] - Feature, Bug, Refactor, Enhancement, etc.
- [TITLE] - The title of the ticket
- [FEATURE_DESCRIPTION] - The detailed description of the ticket, including checklist items if applicable.

Given the context provided as an argument, do this:

A) If the context includes a specific ecosystem adapter (EVM, Stellar etc.) (e.g. ENS Address Support for EVM Adapter) the ticket should be created with the following details:

- Title: [ECOSYSTEM] Adapter - [TYPE]: [TITLE]
- Description: [FEATURE_DESCRIPTION]
- Assignee: pasevin
- Status: Triage

B) If the context includes a specific feature without ecosystem adapter (e.g. Duplicate Record Support) the ticket should be created with the following details:

- Title: [TYPE]: [TITLE]
- Description: [FEATURE_DESCRIPTION]
- Assignee: pasevin
- Status: Triage

## Important

- All tickets should be created under the `PLAT` team id.
- All tickets should be created under the `OSS Contracts UI Builder` project.
