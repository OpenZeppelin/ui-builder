/**
 * Access Control Snapshot Helpers
 *
 * Utilities for serializing, validating, and working with access control snapshots.
 */

import type {
  AccessSnapshot,
  RoleAssignment,
  RoleIdentifier,
} from '@openzeppelin/ui-builder-types';

/**
 * Validates an access snapshot structure
 * @param snapshot The snapshot to validate
 * @returns True if valid, false otherwise
 */
export function validateSnapshot(snapshot: AccessSnapshot): boolean {
  if (!snapshot || typeof snapshot !== 'object') {
    return false;
  }

  if (!Array.isArray(snapshot.roles)) {
    return false;
  }

  // Check for duplicate roles
  const roleIds = new Set<string>();
  for (const roleAssignment of snapshot.roles) {
    if (!roleAssignment || typeof roleAssignment !== 'object') {
      return false;
    }

    if (!roleAssignment.role || typeof roleAssignment.role !== 'object') {
      return false;
    }

    const roleId = roleAssignment.role.id;
    if (!roleId || typeof roleId !== 'string' || roleId.trim() === '') {
      return false;
    }

    if (roleIds.has(roleId)) {
      return false; // Duplicate role
    }
    roleIds.add(roleId);

    if (!Array.isArray(roleAssignment.members)) {
      return false;
    }

    // Check for duplicate members within a role
    const memberSet = new Set<string>();
    for (const member of roleAssignment.members) {
      if (typeof member !== 'string' || member.trim() === '') {
        return false;
      }
      if (memberSet.has(member)) {
        return false; // Duplicate member
      }
      memberSet.add(member);
    }
  }

  // Validate ownership if present
  if (snapshot.ownership !== undefined) {
    if (!snapshot.ownership || typeof snapshot.ownership !== 'object') {
      return false;
    }
    if (
      snapshot.ownership.owner !== null &&
      (typeof snapshot.ownership.owner !== 'string' || snapshot.ownership.owner.trim() === '')
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Serializes an access snapshot to JSON string
 * @param snapshot The snapshot to serialize
 * @returns JSON string representation
 * @throws Error if snapshot is invalid
 */
export function serializeSnapshot(snapshot: AccessSnapshot): string {
  if (!validateSnapshot(snapshot)) {
    throw new Error('Invalid snapshot structure');
  }
  return JSON.stringify(snapshot, null, 2);
}

/**
 * Deserializes a JSON string to an access snapshot
 * @param json The JSON string to deserialize
 * @returns Access snapshot object
 * @throws Error if JSON is invalid or snapshot structure is invalid
 */
export function deserializeSnapshot(json: string): AccessSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (!validateSnapshot(parsed as AccessSnapshot)) {
    throw new Error('Invalid snapshot structure after deserialization');
  }

  return parsed as AccessSnapshot;
}

/**
 * Creates an empty snapshot
 * @returns Empty snapshot with no roles and no ownership
 */
export function createEmptySnapshot(): AccessSnapshot {
  return {
    roles: [],
  };
}

/**
 * Finds a role assignment by role ID
 * @param snapshot The snapshot to search
 * @param roleId The role ID to find
 * @returns The role assignment if found, undefined otherwise
 */
export function findRoleAssignment(
  snapshot: AccessSnapshot,
  roleId: string
): RoleAssignment | undefined {
  return snapshot.roles.find((assignment) => assignment.role.id === roleId);
}

/**
 * Checks if a snapshot has any roles
 * @param snapshot The snapshot to check
 * @returns True if snapshot has at least one role assignment
 */
export function hasRoles(snapshot: AccessSnapshot): boolean {
  return snapshot.roles.length > 0;
}

/**
 * Checks if a snapshot has ownership information
 * @param snapshot The snapshot to check
 * @returns True if snapshot has ownership information
 */
export function hasOwnership(snapshot: AccessSnapshot): boolean {
  return snapshot.ownership !== undefined && snapshot.ownership !== null;
}

/**
 * Gets the total number of role members across all roles
 * @param snapshot The snapshot to count
 * @returns Total number of unique members across all roles
 */
export function getTotalMemberCount(snapshot: AccessSnapshot): number {
  const allMembers = new Set<string>();
  for (const roleAssignment of snapshot.roles) {
    for (const member of roleAssignment.members) {
      allMembers.add(member);
    }
  }
  return allMembers.size;
}

/**
 * Gets all unique members across all roles
 * @param snapshot The snapshot to extract members from
 * @returns Array of unique member addresses
 */
export function getAllMembers(snapshot: AccessSnapshot): string[] {
  const allMembers = new Set<string>();
  for (const roleAssignment of snapshot.roles) {
    for (const member of roleAssignment.members) {
      allMembers.add(member);
    }
  }
  return Array.from(allMembers);
}

/**
 * Compares two snapshots and returns differences
 * @param snapshot1 First snapshot
 * @param snapshot2 Second snapshot
 * @returns Object describing differences
 */
export function compareSnapshots(
  snapshot1: AccessSnapshot,
  snapshot2: AccessSnapshot
): {
  rolesAdded: RoleAssignment[];
  rolesRemoved: RoleAssignment[];
  rolesModified: Array<{
    role: RoleIdentifier;
    membersAdded: string[];
    membersRemoved: string[];
  }>;
  ownershipChanged: boolean;
} {
  const rolesAdded: RoleAssignment[] = [];
  const rolesRemoved: RoleAssignment[] = [];
  const rolesModified: Array<{
    role: RoleIdentifier;
    membersAdded: string[];
    membersRemoved: string[];
  }> = [];

  const roleMap1 = new Map<string, RoleAssignment>();
  const roleMap2 = new Map<string, RoleAssignment>();

  for (const assignment of snapshot1.roles) {
    roleMap1.set(assignment.role.id, assignment);
  }

  for (const assignment of snapshot2.roles) {
    roleMap2.set(assignment.role.id, assignment);
  }

  // Find added and removed roles
  for (const [roleId, assignment] of roleMap2) {
    if (!roleMap1.has(roleId)) {
      rolesAdded.push(assignment);
    }
  }

  for (const [roleId, assignment] of roleMap1) {
    if (!roleMap2.has(roleId)) {
      rolesRemoved.push(assignment);
    }
  }

  // Find modified roles
  for (const [roleId, assignment1] of roleMap1) {
    const assignment2 = roleMap2.get(roleId);
    if (assignment2) {
      const members1 = new Set(assignment1.members);
      const members2 = new Set(assignment2.members);

      const membersAdded = assignment2.members.filter((m) => !members1.has(m));
      const membersRemoved = assignment1.members.filter((m) => !members2.has(m));

      if (membersAdded.length > 0 || membersRemoved.length > 0) {
        rolesModified.push({
          role: assignment1.role,
          membersAdded,
          membersRemoved,
        });
      }
    }
  }

  const ownershipChanged = snapshot1.ownership?.owner !== snapshot2.ownership?.owner;

  return {
    rolesAdded,
    rolesRemoved,
    rolesModified,
    ownershipChanged,
  };
}
