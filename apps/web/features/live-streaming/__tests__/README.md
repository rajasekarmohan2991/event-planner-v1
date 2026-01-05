# Live Streaming Module - Test Suite

Comprehensive automated testing for the live streaming feature.

## 📋 Test Coverage

### API Tests (`streaming.test.ts`)
- ✅ Stream setup and credentials generation
- ✅ Token generation for viewers
- ✅ Stream status management (live/ended)
- ✅ Viewer count tracking
- ✅ Peak viewers analytics
- ✅ Live chat messaging
- ✅ Chat reactions
- ✅ Message deletion
- ✅ Error handling
- ✅ Authentication checks
- ✅ End-to-end streaming flow

### UI Tests (`ui.test.tsx`)
- ✅ Stream setup page rendering
- ✅ RTMP credentials display
- ✅ Copy to clipboard functionality
- ✅ Go Live / End Stream buttons
- ✅ Live analytics display
- ✅ Watch page rendering
- ✅ Chat interface
- ✅ Message sending
- ✅ Reactions
- ✅ Auto-scroll
- ✅ OBS setup guide
- ✅ Error handling

## 🚀 Running Tests

### Run All Tests
```bash
npm test features/live-streaming
```

### Run API Tests Only
```bash
npm test features/live-streaming/__tests__/streaming.test.ts
```

### Run UI Tests Only
```bash
npm test features/live-streaming/__tests__/ui.test.tsx
```

### Run with Coverage
```bash
npm test -- --coverage features/live-streaming
```

### Watch Mode (for development)
```bash
npm test -- --watch features/live-streaming
```

## 📊 Test Statistics

- **Total Tests:** 60+
- **API Tests:** 35+
- **UI Tests:** 25+
- **Coverage Target:** 90%+

## 🔧 Test Setup

### Prerequisites
```bash
npm install --save-dev @jest/globals @testing-library/react @testing-library/jest-dom
```

### Environment Variables
Create `.env.test`:
```
NEXT_PUBLIC_AGORA_APP_ID=test-app-id
AGORA_APP_CERTIFICATE=test-certificate
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
```

### Mock Data
Tests use mock data for:
- User sessions
- Stream credentials
- Chat messages
- Analytics data

## 📝 Test Scenarios

### 1. Stream Setup Flow
```
Create Stream → Generate Credentials → Display RTMP URL/Key → Copy to Clipboard
```

### 2. Go Live Flow
```
Setup Stream → Click Go Live → Update Status → Show LIVE Badge → Track Viewers
```

### 3. Viewer Experience
```
Generate Token → Join Stream → Watch Video → Send Chat → React
```

### 4. Chat Flow
```
Send Message → Display in Chat → Auto-scroll → Delete Message
```

### 5. Analytics Flow
```
Track Viewers → Update Count → Calculate Peak → Display Stats
```

## 🐛 Common Test Failures

### Authentication Errors
**Issue:** Tests fail with 401 Unauthorized  
**Fix:** Ensure mock session is properly configured
```typescript
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: {...} }, status: 'authenticated' })
}))
```

### Database Errors
**Issue:** Tests fail with database connection errors  
**Fix:** Use test database or mock Prisma client
```typescript
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient)
}))
```

### Timeout Errors
**Issue:** Tests timeout waiting for async operations  
**Fix:** Increase timeout or use proper async/await
```typescript
await waitFor(() => {
  expect(screen.getByText('...')).toBeInTheDocument()
}, { timeout: 5000 })
```

## 📈 Continuous Integration

### GitHub Actions
```yaml
name: Test Live Streaming
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test features/live-streaming
```

### Pre-commit Hook
```bash
#!/bin/sh
npm test features/live-streaming -- --bail --findRelatedTests
```

## 🎯 Test Best Practices

1. **Isolation:** Each test should be independent
2. **Cleanup:** Use `beforeEach` and `afterEach` for setup/teardown
3. **Mocking:** Mock external dependencies (API, database)
4. **Assertions:** Use specific, meaningful assertions
5. **Coverage:** Aim for 90%+ code coverage
6. **Speed:** Keep tests fast (<100ms per test)
7. **Reliability:** Tests should pass consistently

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🔍 Debugging Tests

### Run Single Test
```bash
npm test -- -t "should create a new stream session"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "features/live-streaming"],
  "console": "integratedTerminal"
}
```

### Verbose Output
```bash
npm test -- --verbose features/live-streaming
```

## ✅ Test Checklist

Before deploying:
- [ ] All tests pass
- [ ] Coverage > 90%
- [ ] No console errors
- [ ] No flaky tests
- [ ] Performance tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass

## 🚨 Known Issues

None currently. Report issues to the development team.

## 📞 Support

For test-related questions:
- Check test documentation
- Review test examples
- Ask in team chat
- Create GitHub issue
