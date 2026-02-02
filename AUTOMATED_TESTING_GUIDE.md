# 🎬 Automated Browser Testing - Quick Start Guide

## Overview

This automated testing suite provides comprehensive browser testing with video recording for the Event Planner application. Tests cover the complete user journey from account creation to event management.

## 🚀 Quick Start

### 1. Navigate to the web app directory
```bash
cd "apps/web"
```

### 2. Set test credentials (for event creation tests)
```bash
export AUTH_EMAIL="your-test-email@example.com"
export AUTH_PASSWORD="your-test-password"
```

### 3. Run tests
```bash
# Run all tests with visible browser
./run-automated-tests.sh --headed

# Run only authentication tests
./run-automated-tests.sh --auth --headed

# Run in interactive UI mode
./run-automated-tests.sh --ui
```

## 📁 What's Included

### Test Files
- **`tests/complete-flow/auth-and-signup.spec.ts`**
  - Complete authentication flow
  - Sign up → Login → Session persistence → Logout
  - Creates unique test accounts automatically

- **`tests/complete-flow/event-creation-flow.spec.ts`**
  - Complete event management flow
  - Login → Create Event → Add Sessions → Add Speakers
  - Requires existing account credentials

### Supporting Files
- **`run-automated-tests.sh`** - Main test execution script
- **`tests/complete-flow/README.md`** - Detailed documentation
- **`tests/helpers/auth.helper.ts`** - Authentication utilities

## 🎥 Video Recordings

All tests automatically record browser interactions:
- **Location**: `test-results/videos/`
- **Format**: WebM video files
- **Resolution**: 1920x1080 (Full HD)
- **Content**: Complete user journey with all interactions

### Video Folders
```
test-results/videos/
├── auth-flow/          # Authentication test recordings
└── event-creation/     # Event creation test recordings
```

## 📊 Test Coverage

### ✅ Authentication Flow (7 steps)
1. Navigate to Sign Up page
2. Fill registration form
3. Submit and verify account creation
4. Logout
5. Login with new credentials
6. Verify session persistence
7. Final logout

### ✅ Event Creation Flow (9 steps)
1. Login to application
2. Navigate to Create Event
3. Fill basic information
4. Fill location details
5. Fill date and time
6. Submit event
7. Navigate workspace tabs
8. Add a session
9. Add a speaker

## 🎯 Running Tests

### All Tests (Headless)
```bash
./run-automated-tests.sh
```

### All Tests (Visible Browser)
```bash
./run-automated-tests.sh --headed
```

### Specific Test Suites
```bash
# Authentication only
./run-automated-tests.sh --auth --headed

# Event creation only
./run-automated-tests.sh --events --headed
```

### Interactive Mode
```bash
# UI mode - best for development
./run-automated-tests.sh --ui

# Debug mode - step through tests
./run-automated-tests.sh --debug
```

### Direct Playwright Commands
```bash
# Run specific test file
npx playwright test tests/complete-flow/auth-and-signup.spec.ts --headed

# Run with trace
npx playwright test tests/complete-flow/ --trace on

# Show report
npx playwright show-report
```

## 📋 Requirements

### System Requirements
- Node.js 18+ installed
- npm or yarn package manager
- Playwright installed (`npm install`)

### Test Credentials
For **event creation tests**, you need:
```bash
export AUTH_EMAIL="existing-user@example.com"
export AUTH_PASSWORD="existing-password"
```

**Note**: Authentication tests create their own accounts automatically!

## 🎨 Features

### Smart Test Design
- ✅ **Unique test data** - Uses timestamps to avoid conflicts
- ✅ **Robust selectors** - Multiple fallback strategies
- ✅ **Error handling** - Graceful failures with detailed logs
- ✅ **Serial execution** - Tests run in order for dependencies

### Browser Recording
- 🎬 **Full video capture** of all interactions
- 📸 **Screenshots on failure**
- 📊 **HTML test reports**
- 🔍 **Detailed console logging**

### Flexible Execution
- 🖥️ **Headless mode** - Fast CI/CD execution
- 👁️ **Headed mode** - Watch tests run
- 🐛 **Debug mode** - Step-by-step execution
- 🎨 **UI mode** - Interactive test explorer

## 📈 Viewing Results

### HTML Report
```bash
npx playwright show-report
```

### Video Recordings
Navigate to `test-results/videos/` and open video files

### Screenshots
Check `test-results/` for failure screenshots

## 🔧 Troubleshooting

### Tests Skip
**Problem**: Event creation tests skip
**Solution**: Set `AUTH_EMAIL` and `AUTH_PASSWORD` environment variables

### Timeout Errors
**Problem**: Tests timeout
**Solution**: 
- Ensure application is accessible
- Check network connection
- Run in headed mode to see what's happening

### No Videos Generated
**Problem**: Video files not created
**Solution**:
- Check disk space
- Ensure test completes (videos save at end)
- Check `test-results/videos/` directory exists

## 📚 Documentation

- **Detailed Guide**: `tests/complete-flow/README.md`
- **Test Plan**: `tests/E2E_TESTING_PLAN.md`
- **Helper Functions**: `tests/helpers/auth.helper.ts`

## 💡 Tips

1. **First time running?** Start with:
   ```bash
   ./run-automated-tests.sh --auth --headed
   ```

2. **Debugging a test?** Use UI mode:
   ```bash
   ./run-automated-tests.sh --ui
   ```

3. **CI/CD integration?** Use headless:
   ```bash
   ./run-automated-tests.sh
   ```

4. **Want to see everything?** Use headed mode:
   ```bash
   ./run-automated-tests.sh --headed
   ```

## 🎯 Example Workflow

```bash
# 1. Navigate to web app
cd apps/web

# 2. Set credentials (optional, for event tests)
export AUTH_EMAIL="test@example.com"
export AUTH_PASSWORD="password123"

# 3. Run tests with visible browser
./run-automated-tests.sh --headed

# 4. View results
npx playwright show-report

# 5. Check videos
open test-results/videos/auth-flow/
```

## ✨ What Makes This Special

- 🎬 **Complete browser recordings** - See exactly what happened
- 🔄 **End-to-end coverage** - Full user journeys tested
- 🎯 **Production-ready** - Tests against real application
- 📊 **Detailed reporting** - HTML reports + videos + screenshots
- 🚀 **Easy to run** - Single command execution
- 🔧 **Flexible** - Multiple execution modes

## 🎉 Success Indicators

After running tests, you should see:
- ✅ Green checkmarks for passed tests
- 🎥 Video files in `test-results/videos/`
- 📊 HTML report available
- 📝 Console logs showing each step

## 🆘 Need Help?

1. Check `tests/complete-flow/README.md` for detailed docs
2. Run with `--headed` to see what's happening
3. Use `--debug` to step through tests
4. Check Playwright documentation: https://playwright.dev

---

**Created**: January 2026  
**Last Updated**: January 2026  
**Test Framework**: Playwright  
**Coverage**: Authentication + Event Management
