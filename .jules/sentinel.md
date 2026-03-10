## 2024-03-08 - Prevent Mass Assignment (IDOR precursor) in insert handlers
**Vulnerability:** Insert endpoints (`createContact`, `createTask`, `createDeal`) accepted a blind `data.data` payload directly into `db.insert().values()`. Since the object spreading operator `...` overwrites properties with the same name, a malicious actor could send an `id` or `organizationId` in the `data.data` payload, bypassing the server-generated `id` and the authorized `organizationId`.
**Learning:** Object spread syntax `...` applies keys in order. Spreading untrusted data *after* setting trusted fields (`{ id: safeId, ...untrustedData }`) allows the untrusted data to override the trusted fields. This applies to insert operations just as much as updates.
**Prevention:** Always destructure the payload to explicitly separate and discard immutable/protected fields (like `id`, `organizationId`) *before* passing the data to the ORM, even for inserts.

## 2024-03-06 - Prevent Mass Assignment (IDOR precursor) in update handlers
**Vulnerability:** Update endpoints (`updateContact`, `updateTask`) accepted a blind `data.data` payload directly into `db.update().set()`. This allowed malicious actors to update protected fields such as `id` or `organizationId` by injecting them into the data payload, effectively transferring ownership or corrupting primary keys.
**Learning:** Even though TanStack Start creates server functions, any input validator passing `Record<string, unknown>` directly to an ORM's `.set()` method is inherently vulnerable to Mass Assignment.
**Prevention:** Destructure the payload to explicitly separate and discard immutable fields (like `id`, `organizationId`) before performing the update, ensuring that user input only modifies allowed fields.
