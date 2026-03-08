# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Financial profiles database schema with comprehensive client financial data
- Portfolio management system with allocations and transactions
- AUM (Assets Under Management) tracking and reporting
- Commission records tracking for advisors
- Financial profile display component with organized sections

### Fixed

- Contact action buttons not working (documented)
- AI suggestion button not working (documented)
- AI Copilot 404 page (documented)

### Documentation

- Complete testing report with 100% feature coverage
- Bug tracking and improvement roadmap
- Implementation progress documentation
- Architecture analysis and comparison with ERP.MaatWork

## [1.0.0] - 2024-03-07

### Added

- Complete CRM core functionality
- Contact management with CRUD operations
- Pipeline management with Kanban board
- Task management with priorities and assignments
- Team collaboration with goals tracking
- Calendar integration for event scheduling
- Analytics and reporting with AI insights
- Command palette for quick navigation
- Authentication with better-auth
- Database schema with Drizzle ORM

### Features

- Dashboard with KPIs and real-time updates
- Contact directory with search and filters
- Visual pipeline with deal tracking
- Task management with overdue detection
- Team management with goal progress
- Monthly calendar view
- Reports with CSV/PDF export
- Global search with command palette
- Responsive design with dark mode support

---

## Migration from ERP.MaatWork

This is the next generation of MaatWork CRM, rebuilt from the ground up with modern technologies:

- TanStack Start for SSR + SPA
- TanStack Router for type-safe routing
- Drizzle ORM for type-safe database operations
- Tailwind CSS v4 for styling
- Radix UI for accessible components
- Framer Motion for animations

Migration documentation available in `docs/architecture/`.
