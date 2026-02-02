# Ayphen Event Planner - E2E Testing Plan

## Overview
This document outlines the comprehensive end-to-end testing strategy for the Ayphen Event Planner application using Playwright.

## Test Environment
- **Framework**: Playwright
- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: Production - `https://aypheneventplanner.vercel.app`
- **Timeout**: 60 seconds per test
- **Video**: Retain on failure

## Test Credentials Required
```env
AUTH_EMAIL=<test-user-email>
AUTH_PASSWORD=<test-user-password>
ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD=<admin-password>
```

---

## Test Execution Order

Tests are organized in dependency order. Each module builds on the previous.

### Phase 1: Authentication & Access Control

#### 1.1 Login Tests
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| AUTH-01 | Login with valid credentials | Critical |
| AUTH-02 | Login with invalid email | High |
| AUTH-03 | Login with invalid password | High |
| AUTH-04 | Login with empty fields | Medium |
| AUTH-05 | Logout functionality | Critical |
| AUTH-06 | Session persistence after page refresh | High |

#### 1.2 Registration Tests
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| AUTH-07 | Register new user with valid data | Critical |
| AUTH-08 | Register with existing email (should fail) | High |
| AUTH-09 | Register with invalid email format | Medium |
| AUTH-10 | Register with weak password | Medium |

#### 1.3 Password Recovery
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| AUTH-11 | Forgot password - valid email | Medium |
| AUTH-12 | Forgot password - invalid email | Low |

---

### Phase 2: User Dashboard

#### 2.1 User Dashboard Tests
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| DASH-01 | User dashboard loads correctly | Critical |
| DASH-02 | Hero section displays properly | Medium |
| DASH-03 | Event filter works | High |
| DASH-04 | Category filter works | Medium |
| DASH-05 | Search events by name | High |
| DASH-06 | City filter works | Medium |

---

### Phase 3: Event Management (Organizer Flow)

#### 3.1 Create Event
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| EVT-01 | Navigate to create event page | Critical |
| EVT-02 | Fill Step 1 - Basic Info | Critical |
| EVT-03 | Fill Step 2 - Event Details (Location) | Critical |
| EVT-04 | Fill Step 3 - Date & Time | Critical |
| EVT-05 | Fill Step 4 - Media & Extras (optional) | Medium |
| EVT-06 | Fill Step 5 - Legal & Policy | Medium |
| EVT-07 | Submit event and verify creation | Critical |

#### 3.2 Event Workspace Navigation
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| EVT-08 | Access event workspace | Critical |
| EVT-09 | Navigate to Info tab | High |
| EVT-10 | Navigate to Sessions tab | High |
| EVT-11 | Navigate to Speakers tab | High |
| EVT-12 | Navigate to Team tab | High |
| EVT-13 | Navigate to Sponsors tab | Medium |
| EVT-14 | Navigate to Vendors tab | Medium |
| EVT-15 | Navigate to Registrations tab | High |
| EVT-16 | Navigate to Settings tab | Medium |

#### 3.3 Edit Event
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| EVT-17 | Edit event basic info | High |
| EVT-18 | Update event dates | High |
| EVT-19 | Save changes successfully | Critical |

#### 3.4 Delete Event
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| EVT-20 | Delete event from settings | High |
| EVT-21 | Confirm deletion dialog | High |
| EVT-22 | Verify event removed | High |

---

### Phase 4: Sessions & Speakers

#### 4.1 Sessions Management
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| SESS-01 | Create new session | Critical |
| SESS-02 | Fill session title | Critical |
| SESS-03 | Set session start/end time | Critical |
| SESS-04 | Set session room/location | Medium |
| SESS-05 | Save session | Critical |
| SESS-06 | Verify session appears in list | Critical |
| SESS-07 | Edit existing session | High |
| SESS-08 | Delete session | High |

#### 4.2 Speakers Management
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| SPKR-01 | Add new speaker | Critical |
| SPKR-02 | Fill speaker name | Critical |
| SPKR-03 | Fill speaker title/bio | Medium |
| SPKR-04 | Save speaker | Critical |
| SPKR-05 | Verify speaker appears in list | Critical |
| SPKR-06 | Attach speaker to session | High |
| SPKR-07 | Edit speaker | Medium |
| SPKR-08 | Delete speaker | Medium |

---

### Phase 5: Team Management

#### 5.1 Team Members
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| TEAM-01 | View team members list | Critical |
| TEAM-02 | Invite new team member | High |
| TEAM-03 | Set member role | High |
| TEAM-04 | Send invitation | High |
| TEAM-05 | Edit team member role | Medium |
| TEAM-06 | Remove team member | Medium |

---

### Phase 6: Sponsors & Vendors

#### 6.1 Sponsors
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| SPNSR-01 | Add new sponsor | High |
| SPNSR-02 | Fill sponsor details | High |
| SPNSR-03 | Save sponsor | High |
| SPNSR-04 | Verify sponsor in list | High |
| SPNSR-05 | Edit sponsor | Medium |
| SPNSR-06 | Delete sponsor | Medium |

#### 6.2 Vendors
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| VNDR-01 | Add new vendor | High |
| VNDR-02 | Fill vendor details | High |
| VNDR-03 | Save vendor | High |
| VNDR-04 | Verify vendor in list | High |
| VNDR-05 | Edit vendor | Medium |
| VNDR-06 | Delete vendor | Medium |

---

### Phase 7: Registration Flow

#### 7.1 Event Registration (User)
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| REG-01 | Navigate to event registration page | Critical |
| REG-02 | Fill registration form | Critical |
| REG-03 | Submit registration | Critical |
| REG-04 | Verify registration success | Critical |
| REG-05 | View registration confirmation | High |

#### 7.2 Registration Management (Organizer)
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| REG-06 | View registrations list | High |
| REG-07 | Approve registration | High |
| REG-08 | Reject registration | Medium |
| REG-09 | Export registrations | Low |

---

### Phase 8: Floor Plan & Seating

#### 8.1 Floor Plan
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| FP-01 | Navigate to floor planner | High |
| FP-02 | Create new floor plan | High |
| FP-03 | Add seating sections | Medium |
| FP-04 | Save floor plan | High |
| FP-05 | Verify floor plan saved | High |

#### 8.2 Seat Selection (User)
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| SEAT-01 | View available seats | High |
| SEAT-02 | Select seat | High |
| SEAT-03 | Confirm seat selection | High |

---

### Phase 9: Admin Panel

#### 9.1 Admin Dashboard
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| ADM-01 | Access admin dashboard | Critical |
| ADM-02 | View analytics | Medium |
| ADM-03 | View all events | High |
| ADM-04 | View all users | High |

#### 9.2 Admin Settings
| Test ID | Test Case | Priority |
|---------|-----------|----------|
| ADM-05 | Access settings page | Medium |
| ADM-06 | Update system settings | Low |

---

## Test File Structure

```
tests/
├── auth/
│   ├── login.spec.ts
│   ├── register.spec.ts
│   └── password-recovery.spec.ts
├── dashboard/
│   └── user-dashboard.spec.ts
├── events/
│   ├── create-event.spec.ts
│   ├── edit-event.spec.ts
│   └── delete-event.spec.ts
├── sessions/
│   └── sessions-speakers.spec.ts
├── team/
│   └── team-management.spec.ts
├── sponsors-vendors/
│   └── sponsors-vendors.spec.ts
├── registration/
│   └── registration-flow.spec.ts
├── floor-plan/
│   └── floor-plan.spec.ts
├── admin/
│   └── admin-panel.spec.ts
└── helpers/
    ├── auth.helper.ts
    └── test-data.ts
```

---

## Execution Commands

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/auth/login.spec.ts

# Run tests with UI
npx playwright test --ui

# Run tests in headed mode
npx playwright test --headed

# Generate report
npx playwright show-report
```

---

## Test Data Requirements

1. **Test User Account**: Regular user for registration/event viewing
2. **Organizer Account**: For creating/managing events
3. **Admin Account**: For admin panel testing
4. **Test Event**: Pre-created event for testing (or create during test)

---

## Success Criteria

- All Critical priority tests must pass
- 90% of High priority tests must pass
- 80% of Medium priority tests must pass
- Test execution time < 10 minutes for full suite

---

## Notes

1. Tests should be idempotent - can run multiple times
2. Use unique identifiers (timestamps) for test data
3. Clean up test data after test completion
4. Handle network delays with appropriate waits
5. Use data-testid attributes where possible for reliable selectors
