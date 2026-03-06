## 2024-05-18 - Input Component Accessibility
**Learning:** Found that custom form components often lack proper ARIA linkages between inputs and error messages, and rely on hardcoded, localized aria-labels for actions like password toggles. This prevents screen readers from understanding invalid states or the function of icon buttons.
**Action:** Always ensure custom inputs use `aria-invalid` and `aria-describedby` linked to generated IDs for their error messages, and expose props to allow customizing aria-labels for dynamic icons rather than hardcoding them.
