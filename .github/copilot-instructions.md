# Budget App - GitHub Copilot Context

## 🎯 Quick Reference
- **Primary Context**: `.github/copilot/copilot-context.md`
- **Architecture**: Budget-centric design (all entities belong to a budget)
- **Tech Stack**: React + TypeScript + Node.js + PostgreSQL + Prisma
- **Auth System**: JWT with budget-level permissions (READ/WRITE/OWNER)

## 📋 Development Rules
1. **Always validate permissions** before database operations
2. **Use TypeScript strictly** - no `any` types
3. **Responsive design mandatory** - mobile-first approach
4. **Error handling required** in all API routes
5. **Follow existing patterns** defined in copilot-context.md

## 🔧 Available Templates
- `budget-route` - Express route with auth middleware
- `budget-component` - React component template  
- `budget-model` - Prisma model template
- `budget-service` - API service template

For complete documentation, see `.github/copilot/copilot-context.md` (1497 lines)
