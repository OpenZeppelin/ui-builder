---
'@openzeppelin/ui-builder-ui': minor
'@openzeppelin/ui-builder-types': patch
'@openzeppelin/ui-builder-renderer': patch
---

Add FileUploadField component with drag-and-drop support

- Add new FileUploadField component to UI package with comprehensive file upload functionality
- Implement drag-and-drop file upload with visual feedback states
- Add file size validation with customizable limits
- Add file type validation via accept prop
- Include optional base64 conversion for storage
- Provide visual feedback for upload states (idle, processing, success, error)
- Full accessibility support with ARIA attributes and keyboard navigation
- Integration with React Hook Form for validation
- Add file-upload field type to types package
- Register FileUploadField in renderer field registry

Usage: Designed primarily for uploading contract artifacts (ZIP files) in Midnight adapter, but suitable for any file upload needs across the application.

