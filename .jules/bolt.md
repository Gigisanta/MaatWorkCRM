## 2024-05-15 - React re-renders in CalendarWidget
**Learning:** `getEventsForDay` in CalendarWidget is called repeatedly within the map loop for `daysInMonth`, which causes performance bottlenecks (O(N*M) where N is days in month and M is number of events).
**Action:** Memoize the events-by-day mapping outside the loop to reduce computation.
