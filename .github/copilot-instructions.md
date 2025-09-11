# Budget App - GitHub Copilot Context

## 🎯 Quick Reference
- **Primary Context**: `.github/copilot/copilot-context.md`
- **Architecture**: Budget-centric design (all entities belong to a budget)
- **Tech Stack**: React + TypeScript + Node.js + PostgreSQL + Prisma
- **Auth System**: JWT with budget-level permissions (READ/WRITE/OWNER)

## � MANDATORY Development Rules
1. **ALWAYS consult copilot-context.md BEFORE any change**
2. **ALWAYS update copilot-context.md AFTER any change**
3. **Responsive design mandatory** - use `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
4. **Budget sharing support required** - all features must work with shared budgets
5. **Permission validation mandatory** - READ/WRITE/OWNER permissions
6. **Budget isolation critical** - never leak data between budgets
7. **TypeScript strictly enforced** - no `any` types
8. **Error handling required** in all API routes

## � Critical Requirements for ANY Change

### Before Development:
- [ ] Read `.github/copilot/copilot-context.md` for current architecture
- [ ] Verify responsiveness patterns and sharing compatibility
- [ ] Check security requirements and permission models

### During Development:
- [ ] Apply responsive containers: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- [ ] Follow mobile-first breakpoints: mobile(<768px), tablet(768-1024px), desktop(>1024px)
- [ ] Add sharing support: props `budgetId?: string`
- [ ] Implement dual routes: `/api/resource` and `/api/budgets/:budgetId/resource`
- [ ] Use security middleware: `auth`, `budgetAuth`, `requireWritePermission`
- [ ] Maintain budget isolation in all database queries

### After Development:
- [ ] **MANDATORY: Update `.github/copilot/copilot-context.md`**
- [ ] Document new features and changes
- [ ] Test responsiveness (mobile, tablet, desktop)
- [ ] Test sharing permissions (READ/WRITE scenarios)

## �🔧 Available Templates
- `budget-route` - Express route with auth middleware
- `budget-component` - React component template  
- `budget-model` - Prisma model template
- `budget-service` - API service template

For complete documentation, see `.github/copilot/copilot-context.md` (1705+ lines)
