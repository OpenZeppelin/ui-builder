---
'@openzeppelin/ui-builder-adapter-midnight': minor
'@openzeppelin/ui-builder-types': minor
---

Add support for configurable identity secret key property name in Midnight contracts

**Breaking Changes:**
- None

**New Features:**
- Added `RuntimeSecretPropertyInput` interface to support adapter-driven property name configuration
- Midnight adapter now derives the identity secret key property name from contract artifacts
- Added configurable "Secret Key Property Name" field in the Customize step for runtime secret fields
- Property name is automatically detected from contract artifacts (e.g., `organizerSecretKey`, `secretKey`, `ownerKey`)
- Users can override the detected property name if needed

**Improvements:**
- Refactored secret property resolution logic into shared utility function
- Improved error handling for missing or invalid property names
- Added JavaScript identifier validation for property names
- Enhanced helper text to guide users on property name configuration
- Updated terminology from "Organizer" to "Identity-restricted" for better clarity

**Bug Fixes:**
- Fixed empty string handling in property name resolution
- Fixed TextField ID uniqueness for accessibility
- Fixed JSDoc documentation for better clarity

**Internal Changes:**
- Consolidated duplicated `ExtendedRuntimeBinding` type into shared utility
- Improved witness type definition parsing for more reliable property name derivation
- Enhanced logging for witness type definition processing

