## 2024-03-12 - Prevent Man-in-the-Middle (MitM) attacks via Postgres SSL misconfiguration
**Vulnerability:** The production database connection configuration in `apps/web/server/db/index.ts` had `ssl: { rejectUnauthorized: false }`. This disables certificate validation when connecting to the Postgres database, making the connection vulnerable to Man-in-the-Middle (MitM) attacks where an attacker could intercept or modify traffic between the application and the database.
**Learning:** Default examples for `pg` or `drizzle-orm` connections often use `rejectUnauthorized: false` for ease of local development against self-signed certificates. However, deploying this to production entirely negates the security benefits of using SSL/TLS by blindly trusting any certificate presented by a potentially malicious intermediary.
**Prevention:** Always ensure that `rejectUnauthorized: true` is explicitly set for production database connections (e.g., Neon PostgreSQL) to mandate proper SSL certificate validation.

## 2024-03-08 - Prevent Mass Assignment (IDOR precursor) in insert handlers
**Vulnerability:** Insert endpoints (`createContact`, `createTask`, `createDeal`) accepted a blind `data.data` payload directly into `db.insert().values()`. Since the object spreading operator `...` overwrites properties with the same name, a malicious actor could send an `id` or `organizationId` in the `data.data` payload, bypassing the server-generated `id` and the authorized `organizationId`.
**Learning:** Object spread syntax `...` applies keys in order. Spreading untrusted data *after* setting trusted fields (`{ id: safeId, ...untrustedData }`) allows the untrusted data to override the trusted fields. This applies to insert operations just as much as updates.
**Prevention:** Always destructure the payload to explicitly separate and discard immutable/protected fields (like `id`, `organizationId`) *before* passing the data to the ORM, even for inserts.

## 2024-03-06 - Prevent Mass Assignment (IDOR precursor) in update handlers
**Vulnerability:** Update endpoints (`updateContact`, `updateTask`) accepted a blind `data.data` payload directly into `db.update().set()`. This allowed malicious actors to update protected fields such as `id` or `organizationId` by injecting them into the data payload, effectively transferring ownership or corrupting primary keys.
**Learning:** Even though TanStack Start creates server functions, any input validator passing `Record<string, unknown>` directly to an ORM's `.set()` method is inherently vulnerable to Mass Assignment.
**Prevention:** Destructure the payload to explicitly separate and discard immutable fields (like `id`, `organizationId`) before performing the update, ensuring that user input only modifies allowed fields.
