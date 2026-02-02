# Event Planner Demo Guide

## Quick Start (After Rebuild)

### 1. Access the Application
- **URL**: http://localhost:3001
- **Login**: Use your registered account or create a new one

### 2. Create an Event
1. Click "Create Event" button
2. Fill in required fields:
   - **Name**: Your event name
   - **Event Mode**: Choose IN_PERSON, VIRTUAL, or HYBRID
   - **City**: Required for IN_PERSON/HYBRID events
   - **Category**: Select from dropdown
   - **Start/End Date & Time**: Set event schedule
   - **Price**: Set to 0 for free events
3. Click "Create Event"
4. You'll be redirected to the events list

### 3. Manage Event Details

#### Navigate to Event Management
1. From events list, click on your event
2. You'll see tabs: Dashboard, Manage, Sessions, Speakers, Sponsors, Team

#### Add Sessions
1. Go to **Sessions** tab
2. Fill in the form:
   - Title (required)
   - Start/End time
   - Room, Track, Capacity (optional)
   - Description
3. Click "Add Session"
4. **Edit**: Click "Edit" button on any session
5. **Delete**: Click "Delete" button (with confirmation)
6. **Attach Speaker**: In edit mode, use the dropdown to link speakers

#### Add Speakers
1. Go to **Speakers** tab
2. Fill in the form:
   - Name (required)
   - Title, Bio (optional)
   - Photo URL or upload image
3. Click "Add Speaker"
4. **Edit**: Click "Edit" button on any speaker
5. **Delete**: Click "Delete" button (with confirmation)

#### Add Sponsors
1. Go to **Sponsors** tab
2. Fill in the form:
   - Company Name (required)
   - Tier: PLATINUM, GOLD, SILVER, BRONZE, PARTNER
   - Website, Logo URL (optional)
   - Or upload logo image
3. Click "Add Sponsor"
4. **Edit**: Click "Edit" button on any sponsor
5. **Delete**: Click "Delete" button (with confirmation)

#### Manage Team
1. Go to **Team** tab
2. Enter email addresses (comma-separated)
3. Select role: Event Staff, Event Owner, Coordinator, Vendor
4. Click "Send Invites"
5. View invited members in the list below

## Features Implemented

### ✅ Complete CRUD Operations
- **Events**: Create, Read, Update, Delete
- **Sessions**: Create, Read, Update, Delete, Link/Unlink Speakers
- **Speakers**: Create, Read, Update, Delete
- **Sponsors**: Create, Read, Update, Delete
- **Team**: Invite, List, Approve/Reject, Update, Delete

### ✅ Validations
- Required field validation
- Time validation (end > start for sessions)
- Email validation for team invites
- Capacity validation (>= 0)

### ✅ User Experience
- Inline editing for all entities
- Success/error messages
- Confirmation dialogs for delete actions
- Auto-refresh lists after create/update/delete
- Image upload support for speakers and sponsors

### ✅ API Integration
- All operations use server-side authentication
- Proper error handling and user feedback
- Pagination support for lists

## Troubleshooting

### If you see 404 errors:
- Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Clear browser cache
- Check that containers are running: `docker ps`

### If login fails:
- Ensure you're using correct credentials
- Register a new account if needed
- Check API logs: `docker logs eventplannerv1-api-1`

### If create/edit fails:
- Check browser console for error messages
- Verify required fields are filled
- For IN_PERSON/HYBRID events, city is required
- Check API logs for backend errors

## API Endpoints (for reference)

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Sessions
- `GET /api/events/:id/sessions` - List sessions
- `POST /api/events/:id/sessions` - Create session
- `PUT /api/events/:id/sessions/:sessionId` - Update session
- `DELETE /api/events/:id/sessions/:sessionId` - Delete session
- `POST /api/events/:id/sessions/:sessionId/speakers/:speakerId` - Link speaker
- `DELETE /api/events/:id/sessions/:sessionId/speakers/:speakerId` - Unlink speaker

### Speakers
- `GET /api/events/:id/speakers` - List speakers
- `POST /api/events/:id/speakers` - Create speaker
- `PUT /api/events/:id/speakers/:speakerId` - Update speaker
- `DELETE /api/events/:id/speakers/:speakerId` - Delete speaker

### Sponsors
- `GET /api/events/:id/sponsors` - List sponsors
- `POST /api/events/:id/sponsors` - Create sponsor
- `PUT /api/events/:id/sponsors/:sponsorId` - Update sponsor
- `DELETE /api/events/:id/sponsors/:sponsorId` - Delete sponsor

### Team
- `GET /api/events/:id/team/members` - List team members
- `POST /api/events/:id/team/invite` - Invite members
- `POST /api/events/:id/team/reinvite` - Reinvite member
- `POST /api/events/:id/team/approve` - Approve member
- `PUT /api/events/:id/team/members/:memberId` - Update member
- `DELETE /api/events/:id/team/members/:memberId` - Delete member

## Demo Flow Suggestion

1. **Login/Register** → Show authentication
2. **Create Event** → Demonstrate event creation with all fields
3. **Add 2-3 Speakers** → Show speaker management with photos
4. **Add 2-3 Sessions** → Show session creation and speaker linking
5. **Add 2-3 Sponsors** → Show sponsor tiers and logos
6. **Invite Team Members** → Show team collaboration features
7. **Edit Operations** → Demonstrate inline editing
8. **Delete Operations** → Show confirmation and list updates

Good luck with your demo! 🚀
