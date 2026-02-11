---
'@openzeppelin/ui-builder-adapter-evm-core': minor
---

Add human-readable role labels for EVM access control

- Well-known role dictionary (DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE, BURNER_ROLE, UPGRADER_ROLE) with resolveRoleLabel()
- ABI-based role constant extraction via findRoleConstantCandidates() and discoverRoleLabelsFromAbi()
- addKnownRoleIds() accepts { id, label } pairs for externally-provided labels
- roleLabelMap threaded through readCurrentRoles(), queryHistory(), and resolveRoleFromEvent()
- Label resolution precedence: external > ABI-extracted > well-known > undefined
