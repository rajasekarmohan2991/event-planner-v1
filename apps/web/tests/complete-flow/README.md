# Automated Browser Testing Suite

This folder contains comprehensive automated tests for the Event Planner application using Playwright with browser recording.

## 📁 Test Structure

```
complete-flow/
├── auth-and-signup.spec.ts          # Complete authentication flow
├── event-creation-flow.spec.ts      # Event creation and management
└── README.md                         # This file
```

## 🎬 What Gets Recorded

All tests include **browser video recording** that captures:
- User interactions (clicks, typing, navigation)
- Page transitions and loading states
- Form submissions and validations
- Success/error messages
- Complete user journey from start to finish

Videos are saved to: `test-results/videos/`

## 🧪 Test Coverage

### Authentication Flow (`auth-and-signup.spec.ts`)
1. ✅ Navigate to Sign Up page
2. ✅ Fill registration form with unique credentials
3. ✅ Submit and verify account creation
4. ✅ Logout from new account
5. ✅ Login with newly created credentials
6. ✅ Verify session persistence after page refresh
7. ✅ Final logout and verification

### Event Creation Flow (`event-creation-flow.spec.ts`)
1. ✅ Login to application
2. ✅ Navigate to Create Event page
3. ✅ Fill basic event information (Step 1)
4. ✅ Fill location details (Step 2)
5. ✅ Fill date and time (Step 3)
6. ✅ Submit event creation
7. ✅ Navigate event workspace tabs
8. ✅ Add a session
9. ✅ Add a speaker

## 🚀 Running the Tests

### Prerequisites

1. **Install dependencies** (if not already done):
   ```bash
   cd apps/web
   npm install
   ```

2. **Set environment variables** for existing user tests:
   ```bash
   export AUTH_EMAIL="your-test-email@example.com"
   export AUTH_PASSWORD="your-test-password"
   ```

   Or create a `.env.test` file:
   ```env
   AUTH_EMAIL=your-test-email@example.com
   AUTH_PASSWORD=your-test-password
   ```

### Run All Tests

```bash
# Run all complete flow tests
npx playwright test tests/complete-flow/

# Run with UI (interactive mode)
npx playwright test tests/complete-flow/ --ui

# Run in headed mode (see browser)
npx playwright test tests/complete-flow/ --headed

# Run with debug mode
npx playwright test tests/complete-flow/ --debug
```

### Run Specific Test Files

```bash
# Authentication flow only
npx playwright test tests/complete-flow/auth-and-signup.spec.ts

# Event creation flow only
npx playwright test tests/complete-flow/event-creation-flow.spec.ts

# Run with headed mode to watch
npx playwright test tests/complete-flow/auth-and-signup.spec.ts --headed
```

### Run Against Production

```bash
# Test against production URL
npx playwright test tests/complete-flow/ --headed
```

## 📊 Viewing Results

### Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

### Video Recordings

Videos are automatically saved to:
- `test-results/videos/auth-flow/` - Authentication tests
- `test-results/videos/event-creation/` - Event creation tests

Each test run creates a new video file with timestamp.

### Screenshots

Screenshots are captured on test failures in:
- `test-results/`

## 🎯 Test Features

### Smart Selectors
Tests use multiple selector strategies for reliability:
- Role-based selectors (accessible)
- Name/placeholder matching
- Fallback selectors for robustness

### Error Handling
- Graceful handling of missing elements
- Timeout protection
- Conditional logic for optional fields

### Unique Test Data
- Timestamps ensure unique test data
- No conflicts with existing data
- Tests can run multiple times

### Browser Recording
- Full HD video (1920x1080)
- Captures entire user journey
- Saved for debugging and documentation

## 📝 Test Data

### Authentication Flow
- **Email**: Auto-generated with timestamp (`testuser{timestamp}@example.com`)
- **Password**: `TestPassword123!`
- **Name**: Auto-generated (`Test User {timestamp}`)

### Event Creation Flow
- **Event Name**: Auto-generated (`Test Event {timestamp}`)
- **Description**: Standard test description
- **Venue**: Test Convention Center
- **City**: Mumbai
- **Dates**: 30-31 days in the future

## 🔧 Configuration

Tests use the Playwright config from `playwright.config.ts`:
- Base URL: Production or local
- Timeout: 60 seconds per test
- Retries: Configured in playwright.config.ts
- Video: Retained on failure, full recording for complete-flow tests

## 📋 Success Criteria

✅ **Authentication Flow**
- User can sign up with new account
- Login works with created credentials
- Session persists across page refreshes
- Logout works correctly

✅ **Event Creation Flow**
- User can create a complete event
- All wizard steps work correctly
- Event workspace is accessible
- Sessions and speakers can be added

## 🐛 Troubleshooting

### Tests Skip Due to Missing Credentials
**Issue**: Event creation tests skip
**Solution**: Set `AUTH_EMAIL` and `AUTH_PASSWORD` environment variables

### Timeout Errors
**Issue**: Tests timeout waiting for elements
**Solution**: 
- Check if application is running
- Increase timeout in test if needed
- Run in headed mode to see what's happening

### Video Not Recording
**Issue**: No video files generated
**Solution**: 
- Check `test-results/videos/` directory exists
- Ensure sufficient disk space
- Videos only save when test completes

### Element Not Found
**Issue**: Selector doesn't find element
**Solution**:
- Run in headed mode to inspect page
- Update selectors in test file
- Check if page structure changed

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Plan](../E2E_TESTING_PLAN.md)
- [Helper Functions](../helpers/auth.helper.ts)

## 🎥 Example Usage

```bash
# Quick test run with video
npx playwright test tests/complete-flow/auth-and-signup.spec.ts --headed

# Full suite with report
npx playwright test tests/complete-flow/
npx playwright show-report

# Debug specific test
npx playwright test tests/complete-flow/event-creation-flow.spec.ts --debug
```

## ✨ Features

- 🎬 **Full browser recording** of all interactions
- 🔄 **Serial execution** for dependent tests
- 🎯 **Smart selectors** with fallbacks
- 📊 **Detailed logging** of each step
- ✅ **Comprehensive assertions**
- 🔒 **Secure credential handling**
- 🎨 **Clean test data** with timestamps

---

**Last Updated**: January 2026
**Playwright Version**: Latest
**Test Coverage**: Authentication + Event Management
