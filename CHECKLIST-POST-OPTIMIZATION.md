# CHECKLIST POST-OPTIMIZATION

## Status Report

### Issues Found and Fixed

1. **Prisma Schema Error** - `@@index([status])` in Deal model referenced non-existent field `status`.
   - FIXED: Removed the invalid index

2. **next.config.ts Corruption** - `staleTimes` config was placed outside `experimental` and the images block was malformed (duplicate `reactCompiler`).
   - FIXED: Rewrote next.config.ts with correct structure (removed `staleTimes`, removed duplicate `reactCompiler`, fixed images config)

3. **Duplicate `CACHE_TAGS` definition** in `src/lib/cache/index.ts` causing `Cannot redeclare block-scoped variable`.
   - FIXED: Removed duplicate block

4. **`revalidateTag` API mismatch** - Next.js 16 requires second argument `profile: string | CacheLifeConfig`, but calls had 1 argument.
   - FIXED: Added `"max"` as second argument to all `revalidateTag` calls

5. **Duplicate `period` variable** in `src/app/api/reports/analytics/route.ts` (line 1078-1079).
   - FIXED: Removed duplicate line

6. **Undefined variables** in `src/app/api/cron/goals/route.ts`:
   - `teamGoalsProcessed` was incremented but never declared
   - `completedNotifications`, `offTrackNotifications`, `atRiskNotifications` assigned without `const`
   - FIXED: Added `let teamGoalsProcessed = 0` in try block; converted assignments to `const`

### Known Pre-existing Issues (NOT fixed in this round)

- **6 test files failing** - Tests import `canViewReports`, `canManageTasks`, `canBeManager` from `auth-helpers-client.ts` but these functions don't exist there (they're in a server-only file). These tests are pre-existing.

- **Build crashes with SIGABRT** in Next.js 16 production build, likely due to `reactCompiler: true` without `babel-plugin-react-compiler` installed. Root cause: no `react-compiler` package in `package.json`.

## Checklist

- [x] Prisma schema validado (`bun prisma validate` passes)
- [x] TypeScript compile clean (`npx tsc --noEmit` exits with 0)
- [x] API routes con variables corregidas (reports/analytics, cron/goals)
- [x] Cache invalidation funciona (revalidateTag con profile argument)
- [ ] Build exitoso (crash en SIGABRT - requiere `babel-plugin-react-compiler`)
- [ ] Tests pasan (15 failures pre-existentes en auth-helpers-client tests)
- [ ] No console errors en dev
- [ ] Performance mejoró (verificar con Lighthouse)

## Recommended Actions

1. **Install babel-plugin-react-compiler** if `reactCompiler: true` is needed:
   ```bash
   npm install babel-plugin-react-compiler
   ```

2. **Alternatively**, if React Compiler is not required, remove from next.config.ts:
   ```ts
   // Eliminar esta linea de next.config.ts:
   reactCompiler: true,
   ```

3. **Fix pre-existing test failures** in `src/lib/__tests__/auth-helpers-client.test.ts` by either:
   - Adding missing function stubs to `auth-helpers-client.ts`
   - Or removing the tests referencing non-existent functions
