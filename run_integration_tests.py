#!/usr/bin/env python3
"""
Automated Integration Tests for Event Planner
Tests all CRUD operations via API calls
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

BASE_URL = "http://localhost:3001"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []
        self.session = requests.Session()
        self.created_resources = {
            'events': [],
            'speakers': [],
            'sponsors': [],
            'sessions': []
        }
        
    def log(self, message, color=Colors.RESET):
        print(f"{color}{message}{Colors.RESET}")
        
    def test(self, name: str):
        """Decorator for test functions"""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                try:
                    self.log(f"\n🧪 Testing: {name}", Colors.BLUE)
                    result = func(*args, **kwargs)
                    self.log(f"✅ PASSED: {name}", Colors.GREEN)
                    self.passed += 1
                    self.tests.append({'name': name, 'status': 'PASSED'})
                    return result
                except Exception as e:
                    self.log(f"❌ FAILED: {name}", Colors.RED)
                    self.log(f"   Error: {str(e)}", Colors.RED)
                    self.failed += 1
                    self.tests.append({'name': name, 'status': 'FAILED', 'error': str(e)})
            return wrapper
        return decorator
    
    def api_call(self, method: str, path: str, data: Optional[Dict] = None, 
                 expect_success: bool = True) -> Dict[str, Any]:
        """Make API call and return response"""
        url = f"{BASE_URL}{path}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            result = {
                'status': response.status_code,
                'data': response.json() if response.text else None,
                'headers': dict(response.headers)
            }
            
            if expect_success and response.status_code >= 400:
                raise Exception(f"API call failed: {response.status_code} - {response.text}")
            
            return result
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")
    
    def assert_true(self, condition: bool, message: str):
        """Assert condition is true"""
        if not condition:
            raise AssertionError(message)
    
    def assert_equal(self, actual, expected, message: str):
        """Assert two values are equal"""
        if actual != expected:
            raise AssertionError(f"{message}: Expected {expected}, got {actual}")

# Initialize test runner
runner = TestRunner()

# Test Data
def get_future_date(days: int) -> str:
    """Get ISO format date in the future"""
    return (datetime.now() + timedelta(days=days)).isoformat()

TEST_EVENTS = [
    {
        'name': 'Tech Conference 2024 - Test',
        'city': 'Mumbai',
        'venue': 'Convention Center',
        'startsAt': get_future_date(30),
        'endsAt': get_future_date(31),
        'price': 2500,
        'eventMode': 'IN_PERSON',
        'description': 'Annual tech conference for testing'
    },
    {
        'name': 'Virtual Workshop - Test',
        'city': 'Online',
        'venue': 'Zoom',
        'startsAt': get_future_date(15),
        'endsAt': get_future_date(15),
        'price': 500,
        'eventMode': 'VIRTUAL',
        'description': 'Online learning workshop'
    },
    {
        'name': 'Hybrid Meetup - Test',
        'city': 'Delhi',
        'venue': 'Tech Hub',
        'startsAt': get_future_date(20),
        'endsAt': get_future_date(20),
        'price': 0,
        'eventMode': 'HYBRID',
        'description': 'Free community meetup'
    }
]

TEST_SPEAKERS = [
    {
        'name': 'Dr. Sarah Johnson',
        'title': 'Chief Technology Officer',
        'bio': 'Expert in AI and Machine Learning',
        'company': 'TechCorp'
    },
    {
        'name': 'John Smith',
        'title': 'Senior Software Engineer',
        'bio': 'Full-stack developer',
        'company': 'StartupXYZ'
    }
]

TEST_SPONSORS = [
    {
        'name': 'TechCorp Global',
        'tier': 'PLATINUM',
        'website': 'https://techcorp.example.com',
        'description': 'Leading technology solutions'
    },
    {
        'name': 'StartupHub',
        'tier': 'GOLD',
        'website': 'https://startuphub.example.com',
        'description': 'Supporting startups'
    }
]

# Test Functions
@runner.test("Create Event #1")
def test_create_event_1():
    response = runner.api_call('POST', '/api/events', TEST_EVENTS[0])
    runner.assert_true(response['status'] in [200, 201], "Event creation should return 200/201")
    runner.assert_true(response['data'] is not None, "Should return event data")
    
    if response['data'] and 'id' in response['data']:
        runner.created_resources['events'].append(response['data']['id'])
        runner.log(f"   Created event ID: {response['data']['id']}", Colors.YELLOW)
    return response['data']

@runner.test("Create Event #2")
def test_create_event_2():
    response = runner.api_call('POST', '/api/events', TEST_EVENTS[1])
    runner.assert_true(response['status'] in [200, 201], "Event creation should succeed")
    
    if response['data'] and 'id' in response['data']:
        runner.created_resources['events'].append(response['data']['id'])
    return response['data']

@runner.test("Create Event #3")
def test_create_event_3():
    response = runner.api_call('POST', '/api/events', TEST_EVENTS[2])
    runner.assert_true(response['status'] in [200, 201], "Event creation should succeed")
    
    if response['data'] and 'id' in response['data']:
        runner.created_resources['events'].append(response['data']['id'])
    return response['data']

@runner.test("List All Events")
def test_list_events():
    response = runner.api_call('GET', '/api/events?page=1&limit=20')
    runner.assert_equal(response['status'], 200, "Should list events")
    runner.assert_true(response['data'] is not None, "Should return data")
    
    # Check if data is array or paginated response
    events = response['data'] if isinstance(response['data'], list) else response['data'].get('data', [])
    runner.log(f"   Found {len(events)} events", Colors.YELLOW)

@runner.test("Read Event Details")
def test_read_event():
    if not runner.created_resources['events']:
        raise Exception("No events created yet")
    
    event_id = runner.created_resources['events'][0]
    response = runner.api_call('GET', f'/api/events/{event_id}')
    runner.assert_equal(response['status'], 200, "Should fetch event")
    runner.assert_true(response['data']['name'] is not None, "Event should have name")

@runner.test("Update Event")
def test_update_event():
    if not runner.created_resources['events']:
        raise Exception("No events created yet")
    
    event_id = runner.created_resources['events'][0]
    updated_data = {
        **TEST_EVENTS[0],
        'name': 'Updated Tech Conference 2024',
        'price': 3000
    }
    
    response = runner.api_call('PUT', f'/api/events/{event_id}', updated_data)
    runner.assert_equal(response['status'], 200, "Event update should succeed")
    runner.log(f"   Updated event {event_id}", Colors.YELLOW)

@runner.test("Create Speaker #1")
def test_create_speaker_1():
    if not runner.created_resources['events']:
        raise Exception("No events created yet")
    
    event_id = runner.created_resources['events'][0]
    response = runner.api_call('POST', f'/api/events/{event_id}/speakers', TEST_SPEAKERS[0])
    runner.assert_true(response['status'] in [200, 201], "Speaker creation should succeed")
    
    if response['data'] and 'id' in response['data']:
        runner.created_resources['speakers'].append(response['data']['id'])
        runner.log(f"   Created speaker ID: {response['data']['id']}", Colors.YELLOW)

@runner.test("Create Speaker #2")
def test_create_speaker_2():
    if not runner.created_resources['events']:
        raise Exception("No events created yet")
    
    event_id = runner.created_resources['events'][0]
    response = runner.api_call('POST', f'/api/events/{event_id}/speakers', TEST_SPEAKERS[1])
    runner.assert_true(response['status'] in [200, 201], "Speaker creation should succeed")
    
    if response['data'] and 'id' in response['data']:
        runner.created_resources['speakers'].append(response['data']['id'])

@runner.test("List Speakers")
def test_list_speakers():
    if not runner.created_resources['events']:
        raise Exception("No events created yet")
    
    event_id = runner.created_resources['events'][0]
    response = runner.api_call('GET', f'/api/events/{event_id}/speakers')
    runner.assert_equal(response['status'], 200, "Should list speakers")
    
    speakers = response['data'] if isinstance(response['data'], list) else []
    runner.log(f"   Found {len(speakers)} speakers", Colors.YELLOW)

@runner.test("Update Speaker")
def test_update_speaker():
    if not runner.created_resources['speakers']:
        raise Exception("No speakers created yet")
    
    event_id = runner.created_resources['events'][0]
    speaker_id = runner.created_resources['speakers'][0]
    
    updated_data = {
        **TEST_SPEAKERS[0],
        'title': 'Chief Innovation Officer'
    }
    
    response = runner.api_call('PUT', f'/api/events/{event_id}/speakers/{speaker_id}', updated_data)
    runner.assert_equal(response['status'], 200, "Speaker update should succeed")

@runner.test("Create Sponsor #1")
def test_create_sponsor_1():
    if not runner.created_resources['events']:
        raise Exception("No events created yet")
    
    event_id = runner.created_resources['events'][0]
    response = runner.api_call('POST', f'/api/events/{event_id}/sponsors', TEST_SPONSORS[0])
    runner.assert_true(response['status'] in [200, 201], "Sponsor creation should succeed")
    
    if response['data'] and 'id' in response['data']:
        runner.created_resources['sponsors'].append(response['data']['id'])
        runner.log(f"   Created sponsor ID: {response['data']['id']}", Colors.YELLOW)

@runner.test("Create Sponsor #2")
def test_create_sponsor_2():
    if not runner.created_resources['events']:
        raise Exception("No events created yet")
    
    event_id = runner.created_resources['events'][0]
    response = runner.api_call('POST', f'/api/events/{event_id}/sponsors', TEST_SPONSORS[1])
    runner.assert_true(response['status'] in [200, 201], "Sponsor creation should succeed")
    
    if response['data'] and 'id' in response['data']:
        runner.created_resources['sponsors'].append(response['data']['id'])

@runner.test("List Sponsors")
def test_list_sponsors():
    if not runner.created_resources['events']:
        raise Exception("No events created yet")
    
    event_id = runner.created_resources['events'][0]
    response = runner.api_call('GET', f'/api/events/{event_id}/sponsors')
    runner.assert_equal(response['status'], 200, "Should list sponsors")
    
    sponsors = response['data'] if isinstance(response['data'], list) else []
    runner.log(f"   Found {len(sponsors)} sponsors", Colors.YELLOW)

@runner.test("Update Sponsor")
def test_update_sponsor():
    if not runner.created_resources['sponsors']:
        raise Exception("No sponsors created yet")
    
    event_id = runner.created_resources['events'][0]
    sponsor_id = runner.created_resources['sponsors'][0]
    
    updated_data = {
        **TEST_SPONSORS[0],
        'tier': 'GOLD'
    }
    
    response = runner.api_call('PUT', f'/api/events/{event_id}/sponsors/{sponsor_id}', updated_data)
    runner.assert_equal(response['status'], 200, "Sponsor update should succeed")

@runner.test("Delete Speaker")
def test_delete_speaker():
    if not runner.created_resources['speakers']:
        runner.log("   Skipping: No speakers to delete", Colors.YELLOW)
        return
    
    event_id = runner.created_resources['events'][0]
    speaker_id = runner.created_resources['speakers'][0]
    
    response = runner.api_call('DELETE', f'/api/events/{event_id}/speakers/{speaker_id}')
    runner.assert_true(response['status'] in [200, 204], "Speaker deletion should succeed")
    runner.log(f"   Deleted speaker {speaker_id}", Colors.YELLOW)

@runner.test("Delete Sponsor")
def test_delete_sponsor():
    if not runner.created_resources['sponsors']:
        runner.log("   Skipping: No sponsors to delete", Colors.YELLOW)
        return
    
    event_id = runner.created_resources['events'][0]
    sponsor_id = runner.created_resources['sponsors'][0]
    
    response = runner.api_call('DELETE', f'/api/events/{event_id}/sponsors/{sponsor_id}')
    runner.assert_true(response['status'] in [200, 204], "Sponsor deletion should succeed")
    runner.log(f"   Deleted sponsor {sponsor_id}", Colors.YELLOW)

@runner.test("Delete Event")
def test_delete_event():
    if not runner.created_resources['events']:
        runner.log("   Skipping: No events to delete", Colors.YELLOW)
        return
    
    event_id = runner.created_resources['events'][0]
    
    response = runner.api_call('DELETE', f'/api/events/{event_id}')
    runner.assert_true(response['status'] in [200, 204], "Event deletion should succeed")
    runner.log(f"   Deleted event {event_id}", Colors.YELLOW)

def run_all_tests():
    """Run all tests"""
    runner.log(f"\n{Colors.BOLD}🚀 Starting Automated Integration Tests{Colors.RESET}\n")
    runner.log("=" * 60, Colors.BLUE)
    
    # Run tests in order
    test_create_event_1()
    test_create_event_2()
    test_create_event_3()
    test_list_events()
    test_read_event()
    test_update_event()
    test_create_speaker_1()
    test_create_speaker_2()
    test_list_speakers()
    test_update_speaker()
    test_create_sponsor_1()
    test_create_sponsor_2()
    test_list_sponsors()
    test_update_sponsor()
    test_delete_speaker()
    test_delete_sponsor()
    test_delete_event()
    
    # Print summary
    runner.log("\n" + "=" * 60, Colors.BLUE)
    runner.log(f"\n{Colors.BOLD}📊 Test Results Summary:{Colors.RESET}")
    runner.log(f"✅ Passed: {runner.passed}", Colors.GREEN)
    runner.log(f"❌ Failed: {runner.failed}", Colors.RED)
    runner.log(f"📈 Total: {runner.passed + runner.failed}")
    
    success_rate = (runner.passed / (runner.passed + runner.failed) * 100) if (runner.passed + runner.failed) > 0 else 0
    runner.log(f"🎯 Success Rate: {success_rate:.2f}%", Colors.YELLOW)
    
    if runner.failed > 0:
        runner.log(f"\n{Colors.RED}❌ Failed Tests:{Colors.RESET}")
        for test in runner.tests:
            if test['status'] == 'FAILED':
                runner.log(f"   - {test['name']}: {test.get('error', 'Unknown error')}", Colors.RED)
    
    runner.log("\n" + "=" * 60, Colors.BLUE)
    
    return runner.failed == 0

if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        runner.log("\n\n⚠️  Tests interrupted by user", Colors.YELLOW)
        exit(1)
    except Exception as e:
        runner.log(f"\n\n❌ Fatal error: {str(e)}", Colors.RED)
        exit(1)
