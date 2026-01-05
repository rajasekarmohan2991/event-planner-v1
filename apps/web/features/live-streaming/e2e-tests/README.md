# Live Streaming - End-to-End Browser Tests

Comprehensive browser automation tests using Playwright for the live streaming module.

## 📋 Test Coverage

### Functional Tests
- ✅ Stream setup flow
- ✅ RTMP credentials generation
- ✅ Go Live / End Stream
- ✅ Live analytics display
- ✅ Viewer experience
- ✅ Live chat messaging
- ✅ Reactions
- ✅ Navigation
- ✅ OBS setup guide

### Cross-Browser Tests
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari/WebKit
- ✅ Mobile Chrome
- ✅ Mobile Safari
- ✅ iPad

### Responsive Design Tests
- ✅ Mobile (375x667)
- ✅ Tablet (768x1024)
- ✅ Desktop (1920x1080)

### Performance Tests
- ✅ Page load time
- ✅ Network performance
- ✅ Real-time updates

## 🚀 Installation

### Install Playwright
```bash
cd features/live-streaming/e2e-tests
npm install
npm run install
```

This will install Playwright and all required browsers.

## 🎯 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:headed
```

### Run Tests in Debug Mode
```bash
npm run test:debug
```

### Run Tests in Specific Browser
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Run Mobile Tests Only
```bash
npm run test:mobile
```

### Run Tests with UI Mode
```bash
npm run test:ui
```

### View Test Report
```bash
npm run test:report
```

## 📊 Test Results

Test results are automatically saved to `./test-results/` folder:

### Folder Structure
```
test-results/
├── html-report/          # Interactive HTML report
│   └── index.html
├── results.json          # JSON test results
├── junit.xml            # JUnit XML format
├── screenshots/         # Failure screenshots
├── videos/             # Failure videos
└── traces/             # Playwright traces
```

### Viewing Results

**HTML Report (Recommended):**
```bash
npm run test:report
```

**JSON Results:**
```bash
cat test-results/results.json | jq
```

**JUnit XML (for CI/CD):**
```bash
cat test-results/junit.xml
```

## 📝 Test Scenarios

### 1. Stream Setup Flow
```
Navigate to Sessions → Click Stream → Setup Stream → Verify Credentials
```

### 2. Go Live Flow
```
Setup Stream → Click Go Live → Verify LIVE Badge → Check Analytics
```

### 3. Viewer Experience
```
Navigate to Watch Page → Verify Stream Status → Check Viewer Count
```

### 4. Chat Flow
```
Type Message → Send → Verify in Chat → Send Reaction
```

### 5. Navigation Flow
```
Sidebar → Sessions → Stream Button → Stream Page
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:
```bash
BASE_URL=https://aypheneventplanner.vercel.app
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
EVENT_ID=29
SESSION_ID=1
```

### Playwright Config

Edit `playwright.config.ts` to customize:
- Timeout settings
- Browser configurations
- Reporter options
- Screenshot/video settings

## 🐛 Debugging Tests

### Debug Single Test
```bash
npx playwright test --debug -g "should send chat message"
```

### Show Browser While Testing
```bash
npx playwright test --headed --project=chromium
```

### Slow Motion
```bash
npx playwright test --headed --slow-mo=1000
```

### View Trace
```bash
npx playwright show-trace test-results/trace.zip
```

## 📈 CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: |
          cd features/live-streaming/e2e-tests
          npm install
          npm run install
      - name: Run tests
        run: |
          cd features/live-streaming/e2e-tests
          npm test
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: features/live-streaming/e2e-tests/test-results/
```

### Docker

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app
COPY features/live-streaming/e2e-tests/package*.json ./
RUN npm install

COPY features/live-streaming/e2e-tests/ ./
CMD ["npm", "test"]
```

## 🎯 Test Best Practices

1. **Isolation:** Each test is independent
2. **Cleanup:** Tests clean up after themselves
3. **Waiting:** Use proper wait strategies
4. **Selectors:** Use stable selectors (text, role, test-id)
5. **Assertions:** Use meaningful assertions
6. **Screenshots:** Captured on failure
7. **Videos:** Recorded on failure

## 📊 Test Statistics

- **Total Tests:** 40+
- **Browsers:** 6 (Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari, iPad)
- **Scenarios:** 10+
- **Average Runtime:** 5-10 minutes
- **Success Rate Target:** 95%+

## 🔍 Common Issues

### Tests Timing Out
**Solution:** Increase timeout in `playwright.config.ts`
```typescript
timeout: 60 * 1000
```

### Element Not Found
**Solution:** Add proper wait
```typescript
await page.waitForSelector('text=Element')
```

### Flaky Tests
**Solution:** Use retry mechanism
```typescript
retries: 2
```

### Browser Not Installed
**Solution:** Run install command
```bash
npm run install
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## 🚨 Known Issues

None currently. Report issues to the development team.

## 📞 Support

For E2E test questions:
- Check Playwright documentation
- Review test examples
- Ask in team chat
- Create GitHub issue

## ✅ Test Checklist

Before deploying:
- [ ] All tests pass
- [ ] No flaky tests
- [ ] Screenshots reviewed
- [ ] Performance acceptable
- [ ] Cross-browser tested
- [ ] Mobile tested
- [ ] CI/CD configured

## 🎊 Test Results Summary

After running tests, you'll get:
- ✅ Pass/Fail status for each test
- 📊 HTML report with screenshots
- 📹 Videos of failed tests
- 🔍 Detailed traces for debugging
- 📈 Performance metrics
- 🌐 Cross-browser results

Run `npm run test:report` to view the interactive HTML report!
