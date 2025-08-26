# Claude Code Project Documentation

## Project Overview
Kiln Firing Curve Designer - A web application for designing and managing ceramic kiln firing schedules.

## Key Commands

### Development
- `npm run dev` - Start the development server (http://localhost:5173)
- `npm run build` - Build the production application
- `npm run preview` - Preview the built application

### Testing & Quality
- `npm test` - Run all tests in watch mode
- `npm test -- --run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run check` - Run TypeScript and Svelte checks
- `npm run check:watch` - Run checks in watch mode

## Important Notes

### Error Handling
- The toast notification system is used to display validation errors
- The 48-hour limit for firing schedules is enforced in `src/lib/curve-utils.ts`
- Debug mode can be enabled by:
  - Adding `?debug` to the URL (e.g., http://localhost:5173/?debug)
  - Setting `localStorage.setItem('debugMode', 'true')` in the browser console
- When debug mode is enabled, a "Test Errors" dropdown appears in the header for testing

### Testing
- Tests are written using Vitest
- Test files are co-located with their components (*.test.ts)
- Claude Code hooks are configured to automatically run tests on file changes

### Code Quality
- Always run `npm run check` before committing to ensure no TypeScript errors
- The project uses Svelte 5 with TypeScript
- UI components are from the @immich/ui library

## Common Issues & Solutions

### Toast Notifications Not Showing
- Ensure the NotificationToast component is included in the main layout
- Check that the notifications store is properly imported
- Use the "Test Errors" dropdown to verify the toast system works

### TypeScript Errors with @immich/ui
- Button component uses `size: "small" | "medium" | "large"` (not "sm")
- Button variants are: "filled" | "outline" | "ghost" (not "primary")
- Select component follows the same size conventions