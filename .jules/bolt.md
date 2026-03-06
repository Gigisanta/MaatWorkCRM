## 2024-03-24 - Memoizing Nested Loops
**Learning:** Calculating an inner aggregate reduction inside an outer map function on every render creates an O(N*M) calculation per render tick.
**Action:** Extract inner array calculations out of JSX maps by pre-calculating aggregate object maps with useMemo, passing only the calculated value map keys into the markup rendering map.
