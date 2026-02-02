# Recent Changes Review

## Summary
The most recent updates focus on stabilizing the **Event Management** and **Super Admin** capabilities, improving the **Deployment** configuration for Render, and enhancing the **Automated Testing** framework.

## Detailed Changes by Category

### 1. Features & Improvements
*   **Events Management**:
    *   **Draft Status**: The "All" filter in the events list now correctly includes events with `Draft` status.
    *   **Tenant Fallback**: The Events API (`api/events`) now has more robust fallback logic for identifying the tenant/company context, supporting both super-admins and regular company users.
    *   **Status Normalization**: Event status handling has been normalized (likely uppercase/enum consistency) to prevent data inconsistencies.
    *   **Highlights**: Added support for events-only highlights (mentioned in commit message).

*   **Super Admin Modules**:
    *   Enhanced modules for super-admins, specifically around Company management (`app/(admin)/company` pages).

*   **User Interface**:
    *   **Dark Mode**: Implemented support for dark mode.
    *   **Profile**: Updates to the profile page.

*   **Team Management**:
    *   **Idempotent Invites**: Checks to prevent duplicate invitations or errors when re-inviting.

### 2. Infrastructure & Deployment (Render/Railway)
*   **Docker Configuration**:
    *   Switched from Docker-based deployment to **Native Runtimes** (Nixpacks) for Render/Railway.
    *   Renamed `Dockerfile` to `Dockerfile.disabled` in multiple services (`apps/web`, `apps/api-java`) to prevent auto-detection of Docker builds by the platform.
    *   Updated `docker-compose.yml` to reflect these file name changes and ensure `sslmode=disable` for the Postgres connection.
    *   **Production Safety**: Added logic to prevent the production environment from falling back to `localhost` for API calls (`apps/web/lib/apiBase.ts`).

### 3. Automated Testing
*   **Persistent Results**: The test runner (`automated-tests.js`) now saves execution results (JSON and logs) to `test-results/automation` with timestamps.
*   **Refinement**: 
    *   Many granular tests (Speakers, Sponsors, Sessions, Team) have been temporarily marked to **skip** (`console.log('⚠️ Skipping...')`) to focus the test suite on critical Event CRUD operations.
    *   Improved `apiCall` helper to support session cookies for authenticated testing.

### 4. Code Maintenance
*   **Cleanups**: Removed unused or redundant code in `companies/[id]/page.tsx`.
*   **Configuration**: Updated `vitest.config.ts`.

---
*Report generated based on recent git history (Commit `208bed7` and predecessors).*
