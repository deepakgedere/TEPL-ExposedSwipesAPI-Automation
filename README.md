# Playwright Test Automation

A comprehensive test automation suite for ACS (Access Control System) Events API endpoints and database operations, built with Playwright and TypeScript.

## Project Overview

This project contains automated tests for verifying ACS swipe events functionality, including:
- API endpoint testing for swipe events retrieval
- Database query validation
- Authentication and authorization testing
- Reader filter operations
- Data integrity validation across multiple date/time formats

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **SQL Server**: For database connectivity (if running database tests)
- **Microsoft Edge**: For browser-based tests (configured by default)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd playwright-test-automation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers (if not already installed):
   ```bash
   npx playwright install
   ```

## Configuration

### Test Configuration File

Update [config/test-config.json](config/test-config.json) with your environment-specific settings:

```json
{
  "api": {
    "baseUrl": "https://your-api-endpoint.com",
    "validAuthKey": "your-valid-auth-key",
    "invalidAuthKey": "your-invalid-auth-key",
    "serialNo": 1234,
    "serverInsrtTime": "2024-01-01T00:00:00Z",
    "dtStart": "2024-01-01",
    "dtEnd": "2024-01-31"
  },
  "tblConfiguration": {
    "EmployeeNoPrefix": "EMP"
  },
  "database": {
    "user": "your-db-user",
    "password": "your-db-password",
    "server": "your-sql-server",
    "port": 1433,
    "database": "your-database-name",
    "options": {
      "instanceName": "SQLEXPRESS",
      "encrypt": true,
      "trustServerCertificate": true
    }
  },
  "readerNames": {
    "valid": ["Reader1", "Reader2"],
    "single": ["SingleReader"],
    "initial": ["InitialReader"],
    "updated": ["UpdatedReader"],
    "special": ["Special-Reader"],
    "duplicate": ["DuplicateReader"],
    "empty": [],
    "largePrefix": "LargePrefix",
    "largeCount": 100
  }
}
```

## Running Tests

### Basic Test Execution

Run all tests:
```bash
npm test
```

### Headless Mode (Default)
Tests run without opening a browser window.

### Headed Mode
Run tests with visible browser windows:
```bash
npm run test:headed
```

### Interactive UI Mode
Run tests with Playwright's interactive UI for debugging:
```bash
npm run test:ui
```

### Code Generation
Auto-generate test code by recording user interactions:
```bash
npm run codegen
```

## Project Structure

```
playwright-test-automation/
├── config/
│   └── test-config.json          # Test configuration and environment settings
├── tests/
│   ├── config.ts                 # Test configuration loader
│   ├── GetSwipesByDateEventTimeTest.spec.ts  # Tests for date/event time queries
│   ├── GetSwipesEventsTest.spec.ts          # Tests for swipe events retrieval
│   ├── SaveFilterReadersTest.spec.ts        # Tests for reader filter operations
│   └── helpers/
│       └── database.ts           # Database helper functions
├── specs/
│   └── README.md                 # Test specifications documentation
├── test-results/                 # Test output and attachments
├── playwright-report/            # HTML test reports
├── playwright.config.ts          # Playwright configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## Test Suites

### GetSwipesByDateEventTimeTest.spec.ts
Tests the `GetSwipesEventsByEventDateTime` API endpoint:
- **Valid authentication**: Verifies API returns correct swipe events with valid auth key
- **Invalid authentication**: Tests proper rejection of invalid credentials
- **Registered readers**: Validates filtering by reader names
- **Event date filtering**: Tests date range filtering with event date and local time
- **Database validation**: Compares API results with database queries

### GetSwipesEventsTest.spec.ts
Tests swipe events retrieval with various parameters:
- Serial number-based queries
- Server insertion time filtering
- Event date time filtering
- Multi-parameter combinations
- Response validation and data integrity

### SaveFilterReadersTest.spec.ts
Tests reader filter management functionality:
- Save reader filters
- Filter validation
- Data persistence
- Cleanup operations

## Test Configuration

The Playwright configuration [playwright.config.ts](playwright.config.ts) includes:
- **Test Directory**: `./tests`
- **Timeout**: 30 seconds per test
- **Workers**: 1 (serial execution)
- **Browser**: Microsoft Edge
- **Viewport**: 1280x720
- **Video**: Captured on test failure
- **Reporter**: List format + HTML report

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

Reports are generated in the `playwright-report/` directory with:
- Test execution summaries
- Pass/fail status
- Video recordings of failures
- Detailed error messages

## Database Integration

Tests connect to SQL Server for data validation. The `database.ts` helper provides:
- Database connection management
- Query execution
- Employee prefix setup
- Filter reader cleanup

### Sample Database Functions
- `queryWithEventDateLocalTime()`: Execute queries with date/time filters
- `setupemployeePrefix()`: Configure employee number prefixes
- `cleanupFilterReaders()`: Clean up test data after execution

## Common Issues & Troubleshooting

### Database Connection Failures
- Verify SQL Server is running and accessible
- Check connection credentials in `test-config.json`
- Ensure the database exists and user has appropriate permissions
- Confirm `trustServerCertificate` setting matches your environment

### API Authentication Errors
- Verify `validAuthKey` is correct in configuration
- Check API endpoint `baseUrl` is accessible
- Ensure network connectivity to the API server

### Browser Issues
- Ensure Microsoft Edge is installed
- Run `npx playwright install msedge` to ensure browser binaries are available
- Check viewport dimensions match your testing needs

### Test Timeouts
- Increase timeout values in `playwright.config.ts` if needed
- Check API response times are within expected limits
- Verify database queries are performing adequately

## Development

### Writing New Tests
1. Create a new `.spec.ts` file in the `tests/` directory
2. Import necessary Playwright utilities and helpers
3. Use the `test.describe()` and `test()` functions to define test suites and cases
4. Access configuration via `testConfig` from `./config.ts`
5. Use database helpers from `./helpers/database.ts` as needed

### Debugging Tests
- Use `--debug` flag: `npx playwright test --debug`
- Set breakpoints in VS Code with TypeScript debugging
- Check test reports for video recordings of failures
- Use `console.log()` for inline debugging output

## Dependencies

- **@playwright/test**: ^1.60.0 - Test framework
- **playwright**: ^1.60.0 - Browser automation
- **typescript**: ^5.5.0 - TypeScript compiler
- **mssql**: ^12.5.4 - SQL Server database driver
- **express**: ^5.2.1 - Web framework (optional, for test utilities)

## License

ISC

## Support

For issues or questions, refer to:
- [Playwright Documentation](https://playwright.dev)
- [MSSQL Node Documentation](https://github.com/tediousjs/node-mssql)
- Project team documentation in the `specs/` directory
