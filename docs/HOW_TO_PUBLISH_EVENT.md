# 🚀 How to Publish Your Event

## Quick Steps to Publish

### Method 1: Using the Publish Page (Recommended)

1. **Navigate to your event dashboard**
   - Go to http://localhost:3001
   - Sign in to your account
   - Select your event

2. **Click the "Publish Event" button**
   - Look for the prominent **purple "Publish Event"** button in the left sidebar
   - It's located right below the event title

3. **Review the pre-publish checklist**
   - Event name is set ✓
   - Event date and time configured ✓
   - Venue information added ✓
   - Event description provided ✓

4. **Click "Publish Event"**
   - Your event status will change from **DRAFT** to **LIVE**
   - The public event page will become accessible
   - You'll get a shareable public URL

5. **Share your event**
   - Copy the public URL
   - Share it with attendees
   - They can now view details and register!

---

### Method 2: Using the Design Page

1. Go to **Event → Design**
2. Customize your event microsite:
   - Choose a theme (Default, Modern, Minimal)
   - Set primary color
   - Add hero title and subtitle
3. Click **"Save Draft"** to save changes
4. Click **"Publish"** to make the microsite live

---

## What Happens When You Publish?

✅ **Event Status Changes**: DRAFT → LIVE  
✅ **Public Page Active**: Event becomes visible at `/events/{id}/public`  
✅ **Registration Opens**: Attendees can register  
✅ **Shareable URL**: Get a link to share with attendees  

---

## Event Status Flow

```
DRAFT → LIVE → COMPLETED
   ↓      ↓
CANCELLED  TRASHED
```

- **DRAFT**: Event is being set up (not public)
- **LIVE**: Event is published and accepting registrations
- **COMPLETED**: Event has ended
- **CANCELLED**: Event was cancelled
- **TRASHED**: Event was deleted (can be restored)

---

## API Endpoint

If you want to publish programmatically:

```bash
# Publish event
curl -X PATCH http://localhost:3001/api/events/{eventId}/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"

# Response
{
  "id": 1,
  "name": "My Event",
  "status": "LIVE",
  ...
}
```

---

## Unpublishing / Changing Status

Currently, you can:
- **Cancel Event**: Changes status to CANCELLED
- **Trash Event**: Soft deletes the event
- **Restore Event**: Brings back a trashed event

To change status back to DRAFT, you can update via the API or database directly.

---

## Troubleshooting

### "Failed to publish event"
- Check that you're logged in
- Verify the event exists
- Check API logs: `docker compose logs api`

### Public page not showing
- Ensure event is published (status = LIVE)
- Clear browser cache
- Check the URL format: `/events/{id}/public`

### Can't access publish page
- Verify you have proper permissions
- Check that you're an event owner or organizer

---

## Quick Database Check

To verify event status in database:

```bash
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT id, name, status FROM events;"
```

Expected output:
```
 id |  name  | status 
----+--------+--------
  1 | event  | LIVE
```

---

## Next Steps After Publishing

1. ✅ **Test Registration**: Try registering as an attendee
2. ✅ **Share Event URL**: Send to potential attendees
3. ✅ **Configure Tickets**: Set up ticket types and pricing
4. ✅ **Set Up Notifications**: Configure email templates
5. ✅ **Add Team Members**: Invite organizers and staff
6. ✅ **Monitor Analytics**: Track registrations and sales

---

**Your event is now live! 🎉**
