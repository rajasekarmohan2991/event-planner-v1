#!/bin/bash

# Automated Browser Testing Script for Event Planner
# This script runs comprehensive tests with browser recording

set -e

echo "🎬 Event Planner - Automated Browser Testing Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from apps/web directory${NC}"
    exit 1
fi

# Check for Playwright
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Create test results directories
echo -e "${BLUE}📁 Creating test results directories...${NC}"
mkdir -p test-results/videos/auth-flow
mkdir -p test-results/videos/event-creation
mkdir -p test-results/screenshots
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Check for environment variables
echo -e "${BLUE}🔍 Checking test credentials...${NC}"
if [ -z "$AUTH_EMAIL" ] || [ -z "$AUTH_PASSWORD" ]; then
    echo -e "${YELLOW}⚠️  Warning: AUTH_EMAIL and AUTH_PASSWORD not set${NC}"
    echo -e "${YELLOW}   Event creation tests will be skipped${NC}"
    echo -e "${YELLOW}   To run all tests, set these environment variables:${NC}"
    echo -e "${YELLOW}   export AUTH_EMAIL='your-email@example.com'${NC}"
    echo -e "${YELLOW}   export AUTH_PASSWORD='your-password'${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Test credentials found${NC}"
    echo ""
fi

# Function to run tests
run_test() {
    local test_name=$1
    local test_file=$2
    local mode=$3
    
    echo -e "${BLUE}🧪 Running: ${test_name}${NC}"
    echo "   File: ${test_file}"
    echo "   Mode: ${mode}"
    echo ""
    
    if [ "$mode" == "headed" ]; then
        npx playwright test "$test_file" --headed
    elif [ "$mode" == "debug" ]; then
        npx playwright test "$test_file" --debug
    elif [ "$mode" == "ui" ]; then
        npx playwright test "$test_file" --ui
    else
        npx playwright test "$test_file"
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ ${test_name} - PASSED${NC}"
    else
        echo -e "${RED}❌ ${test_name} - FAILED${NC}"
    fi
    echo ""
    
    return $exit_code
}

# Parse command line arguments
MODE="headless"
TEST_SUITE="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        --headed)
            MODE="headed"
            shift
            ;;
        --debug)
            MODE="debug"
            shift
            ;;
        --ui)
            MODE="ui"
            shift
            ;;
        --auth)
            TEST_SUITE="auth"
            shift
            ;;
        --events)
            TEST_SUITE="events"
            shift
            ;;
        --help)
            echo "Usage: ./run-automated-tests.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --headed     Run tests in headed mode (visible browser)"
            echo "  --debug      Run tests in debug mode"
            echo "  --ui         Run tests in UI mode (interactive)"
            echo "  --auth       Run only authentication tests"
            echo "  --events     Run only event creation tests"
            echo "  --help       Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run-automated-tests.sh                    # Run all tests headless"
            echo "  ./run-automated-tests.sh --headed           # Run all tests with visible browser"
            echo "  ./run-automated-tests.sh --auth --headed    # Run only auth tests with visible browser"
            echo "  ./run-automated-tests.sh --ui               # Run in interactive UI mode"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "   Mode: ${MODE}"
echo "   Suite: ${TEST_SUITE}"
echo ""

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run tests based on suite selection
if [ "$TEST_SUITE" == "all" ] || [ "$TEST_SUITE" == "auth" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test "Authentication & Signup Flow" "tests/complete-flow/auth-and-signup.spec.ts" "$MODE"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

if [ "$TEST_SUITE" == "all" ] || [ "$TEST_SUITE" == "events" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if run_test "Event Creation Flow" "tests/complete-flow/event-creation-flow.spec.ts" "$MODE"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi

# Summary
echo ""
echo "=================================================="
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=================================================="
echo "   Total Tests: ${TOTAL_TESTS}"
echo -e "   ${GREEN}Passed: ${PASSED_TESTS}${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "   ${RED}Failed: ${FAILED_TESTS}${NC}"
else
    echo -e "   ${GREEN}Failed: ${FAILED_TESTS}${NC}"
fi
echo ""

# Video recordings
echo -e "${BLUE}🎥 Video Recordings:${NC}"
echo "   Location: test-results/videos/"
echo "   - auth-flow/         (Authentication tests)"
echo "   - event-creation/    (Event creation tests)"
echo ""

# Show report option
echo -e "${BLUE}📈 View detailed report:${NC}"
echo "   npx playwright show-report"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
fi
