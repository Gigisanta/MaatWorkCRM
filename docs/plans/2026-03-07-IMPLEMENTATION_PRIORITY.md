# Implementation Priority Plan - MaatWorkCRM

**Date:** 2026-03-07
**Status:** Ready for Implementation
**Source:** Deep analysis of ERP.MaatWork repository

---

## Executive Summary

From comprehensive analysis of ERP.MaatWork, we've identified **6 confirmed missing modules** that should be implemented in MaatWorkCRM to achieve feature parity. These are prioritized based on business value and complexity.

---

## Priority Levels

### 🔴 PRIORITY 1: Core Business Differentiators
*Implement first - these are strategic for financial advisor CRM market*

#### 1.1 Portfolios & AUM Management
**Route:** `/apps/web/app/portfolios` (found in ERP.MaatWork)

**Business Value:** ⭐⭐⭐⭐⭐ (Critical differentiator)
- Core value proposition for financial advisors
- Track assets under management per client
- Monthly snapshots of portfolio value
- Dashboard showing total AUM growth

**Implementation Estimate:** 2-3 days

**Database Schema Required:**
```sql
- portfolios (id, name, client_id, advisor_id, created_at)
- portfolio_snapshots (id, portfolio_id, value, date)
- portfolio_allocations (id, portfolio_id, asset_class_id, percentage)
- asset_classes (id, name, type)
```

**Features to Implement:**
- [ ] Portfolio list page (table with search/filter)
- [ ] Portfolio detail page (allocation chart, performance)
- [ ] Add/Edit portfolio modal
- [ ] Automatic monthly snapshot job (Inngest)
- [ ] Total AUM dashboard widget
- [ ] AUM growth trend chart (SparklineChart component)
- [ ] Export portfolio data (CSV/PDF)

**UI Components Needed:**
- PortfolioCard, AllocationChart, PerformanceTable, SnapshotHistory

---

#### 1.2 Career Plan (Advisor Levels)
**Route:** `/apps/web/app/career-plan` (found in ERP.MaatWork)

**Business Value:** ⭐⭐⭐⭐⭐ (Retention & motivation tool)
- Motivates advisors to progress
- Clear career progression path
- Gamification element increases engagement

**Implementation Estimate:** 2-3 days

**Database Schema Required:**
```sql
- career_levels (id, name, min_aum, max_aum, requirements)
- advisor_career (id, advisor_id, level_id, achieved_at, progress)
- career_milestones (id, level_id, name, criteria)
- milestone_achievements (id, advisor_id, milestone_id, achieved_at)
```

**Levels to Define:**
1. **Junior** - Entry level, < $1M AUM
2. **Senior** - Mid level, $1M-$5M AUM
3. **Senior+** - Expert level, > $5M AUM

**Features to Implement:**
- [ ] Career dashboard (current level, progress to next)
- [ ] Level requirements display (AUM targets, certifications)
- [ ] Milestone tracker with badges
- [ ] Career progression timeline
- [ ] Leaderboard (optional - advisors by AUM)
- [ ] Achievement notifications

**UI Components Needed:**
- CareerLevelCard, ProgressBar, MilestoneList, Badge

---

### 🟡 PRIORITY 2: Productivity & UX Enhancements
*Implement second - improve user experience and retention*

#### 2.1 Notifications Center
**Route:** `/apps/web/app/notifications` (found in ERP.MaatWork)

**Business Value:** ⭐⭐⭐⭐ (User engagement)
- Centralized notification management
- Prevents missed important updates
- Improves responsiveness

**Implementation Estimate:** 2-3 days

**Database Schema Required:**
```sql
- notifications (id, user_id, type, priority, title, body, read_at, created_at)
- notification_settings (id, user_id, email_enabled, push_enabled)
```

**Features to Implement:**
- [ ] Notifications bell with unread count badge
- [ ] Notifications dropdown panel
- [ ] Priority-based grouping (high, normal, low)
- [ ] Mark as read/unread
- [ ] Notification history page
- [ ] Per-user notification preferences
- [ ] Notification templates (for system events)

**UI Components Needed:**
- NotificationsPanel, NotificationItem, NotificationBadge, SettingsForm

---

#### 2.2 Automations Engine
**Route:** `/apps/web/app/automations` (found in ERP.MaatWork)

**Business Value:** ⭐⭐⭐ (Efficiency)
- Reduce manual work
- Automated workflows
- Consistency in processes

**Implementation Estimate:** 3-4 days

**Database Schema Required:**
```sql
- automations (id, user_id, name, trigger, action, enabled)
- automation_logs (id, automation_id, triggered_at, result)
```

**Features to Implement:**
- [ ] Automation rule builder (visual or code-based)
- [ ] Triggers: contact status change, task due date, goal threshold
- [ ] Actions: send email, create task, send notification
- [ ] Automation list with enable/disable toggle
- [ ] Execution history and logs
- [ ] Test automation button

**Example Automations:**
- When contact becomes "active" → Send welcome email
- When task is 1 day overdue → Send reminder notification
- When goal reaches 80% → Alert team leader

**UI Components Needed:**
- AutomationBuilder, AutomationCard, TriggerSelector, ActionSelector

---

### 🟢 PRIORITY 3: Analytics & Administration
*Implement last - power features for management*

#### 3.1 Advanced Analytics
**Route:** `/apps/web/app/analytics` (found in ERP.MaatWork)

**Business Value:** ⭐⭐⭐ (Decision support)
- Deep insights into business performance
- Trend analysis
- Better decision making

**Implementation Estimate:** 2-3 days

**Features to Implement:**
- [ ] Advanced analytics dashboard
- [ ] AUM growth trends
- [ ] Client acquisition funnel
- [ ] Pipeline conversion rates
- [ ] Team performance comparison
- [ ] Custom date range filters
- [ ] Export reports (PDF/Excel)

**UI Components Needed:**
- AnalyticsDashboard, TrendChart, FunnelChart, ComparisonTable

---

#### 3.2 Admin Panel
**Route:** `/apps/web/app/admin` (found in ERP.MaatWork)

**Business Value:** ⭐⭐⭐ (System management)
- Centralized system administration
- User management
- System configuration

**Implementation Estimate:** 2-3 days

**Database Schema Required:**
```sql
- admin_audit_logs (id, admin_id, action, entity_id, changes, created_at)
- system_settings (id, key, value, updated_at, updated_by)
```

**Features to Implement:**
- [ ] User management (CRUD, permissions)
- [ ] Organization management
- [ ] System configuration panel
- [ ] Audit log viewer
- [ ] System health monitoring
- [ ] Backup/restore (optional)

**UI Components Needed:**
- AdminLayout, UserTable, OrgTable, AuditLogViewer

---

## Implementation Order Recommendation

### Phase 1: Core Differentiators (Weeks 1-2)
1. **Week 1:** Portfolios & AUM
   - Day 1-2: Database schema + API endpoints
   - Day 3-4: UI components + Portfolio pages
   - Day 5: Integration + Testing

2. **Week 2:** Career Plan
   - Day 1-2: Database schema + Level definitions
   - Day 3-4: Career dashboard + Progress tracking
   - Day 5: Milestones + Notifications

### Phase 2: Productivity (Weeks 3-4)
3. **Week 3:** Notifications Center
   - Day 1-2: Schema + API
   - Day 3-4: UI components + Bell integration
   - Day 5: Settings + Testing

4. **Week 4:** Automations Engine
   - Day 1-2: Schema + Engine core
   - Day 3-4: Rule builder + Predefined automations
   - Day 5: Testing + Documentation

### Phase 3: Power Features (Weeks 5-6)
5. **Week 5:** Advanced Analytics
   - Day 1-2: Data aggregation + APIs
   - Day 3-4: Dashboard + Charts
   - Day 5: Export + Testing

6. **Week 6:** Admin Panel
   - Day 1-2: User/Org management
   - Day 3-4: System settings + Audit logs
   - Day 5: Integration + Testing

---

## Technical Notes

### Integration with Existing System

**TanStack Stack Compatibility:**
- Use TanStack Router for new routes: `createFileRoute("/portfolios")`
- Use TanStack Query for data fetching: `useQuery`, `useMutation`
- Use better-auth for authentication
- Use Inngest for background jobs (snapshots, automations)

**Design System:**
- Follow `/docs/plans/2026-03-07-design-system.md`
- Use existing components: Button, Card, Modal, Table
- Apply glassmorphism v2 styling
- Maintain violet/fuchsia color scheme

**Database:**
- Extend existing Drizzle schema in `apps/web/server/db/schema/`
- Generate migrations: `pnpm --filter web db:generate`
- Push to Neon: `pnpm --filter web db:push`

### Existing Reusable Components

From current MaatWorkCRM:
- ✅ `SparklineChart.tsx` - For AUM trends
- ✅ `AnimatedCounter.tsx` - For KPI displays
- ✅ `Modal.tsx` - For add/edit forms
- ✅ `Table.tsx` - For list views
- ✅ `Button.tsx` - With all variants
- ✅ `Badge.tsx` - For status indicators

---

## Success Criteria

Each module is considered complete when:
- [ ] Database schema created and migrated
- [ ] API endpoints implemented and tested
- [ ] UI components built with premium design
- [ ] All pages responsive (mobile/tablet/desktop)
- [ ] Linting passes (Biome)
- [ ] Type errors resolved (LSP diagnostics clean)
- [ ] Manual testing completed
- [ ] Documentation updated

---

## Decision Required

**Before starting implementation, please prioritize:**

**Option A:** Focus on **Business Value** (Recommended)
- Implement Priority 1 (Portfolios + Career Plan) first
- These differentiate MaatWorkCRM from competitors
- Addresses core financial advisor use case

**Option B:** Focus on **UX/Productivity**
- Implement Priority 2 (Notifications + Automations) first
- Improves user experience
- Easier to implement, faster to show value

**Option C:** **Balanced Approach**
- Implement 1 from each priority level
- Mix of business value and UX improvements
- Slower progress but more diverse

**Recommendation:** **Option A** - Implement core business differentiators first, as these are what will attract and retain financial advisor clients.

---

**Document Version:** 1.0
**Last Updated:** 2026-03-07
**Status:** Ready for User Review and Decision
