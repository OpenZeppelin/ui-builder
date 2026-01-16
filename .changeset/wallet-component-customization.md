---
'@openzeppelin/ui-builder-adapter-evm': minor
'@openzeppelin/ui-builder-adapter-stellar': minor
'@openzeppelin/ui-builder-adapter-midnight': minor
---

Implement wallet component customization props

All adapters now support the following `BaseComponentProps` on wallet components (`ConnectButton`, `AccountDisplay`, `NetworkSwitcher`):

- `size`: Control component size (`'sm' | 'default' | 'lg' | 'xl'`)
- `variant`: Control visual style (`'default' | 'outline' | 'ghost' | 'secondary'`)
- `fullWidth`: Expand component to fill container width
- `className`: Additional CSS classes for custom styling

This enables developers to customize wallet UI components to match their application design.
