# 🎯 Demo Quick Reference Card

## 🚀 TO PUBLISH YOUR EVENT - 3 SIMPLE STEPS

### Step 1: Login & Navigate
```
URL: http://localhost:3001
Login → Select Event → Look for Purple "Publish Event" Button
```

### Step 2: Review & Publish
```
Click "Publish Event" in Sidebar
→ Review Checklist
→ Click "Publish Event" Button
→ Wait for Success Message ✓
```

### Step 3: Share
```
Copy Public URL
Share with Attendees
They can now register!
```

---

## 📍 Key URLs

| Purpose | URL |
|---------|-----|
| **Main App** | http://localhost:3001 |
| **Event Dashboard** | http://localhost:3001/events/1 |
| **Publish Page** | http://localhost:3001/events/1/publish |
| **Public Event** | http://localhost:3001/events/1/public |
| **API Backend** | http://localhost:8081 |

---

## ✅ Current Status

```
Event ID: 1
Name: event
Status: DRAFT → Ready to publish!
```

---

## 🎬 Demo Flow (6 minutes)

1. **Login** (30 sec)
   - Show dashboard
   - Point out purple button

2. **Navigate to Publish** (30 sec)
   - Click "Publish Event"
   - Show publish page

3. **Review Checklist** (1 min)
   - Event name ✓
   - Date/time ✓
   - Venue ✓
   - Description ✓

4. **Publish** (1 min)
   - Click button
   - Show success
   - Status: DRAFT → LIVE

5. **Share URL** (1 min)
   - Copy public URL
   - Click "View"
   - Show public page

6. **Demo Registration** (2 min)
   - Show event details
   - Fill registration form
   - Complete registration

---

## 🔧 Quick Commands

### Check Event Status
```bash
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT id, name, status FROM events;"
```

### Restart Services
```bash
docker compose restart
```

### View Logs
```bash
docker compose logs -f web
docker compose logs -f api
```

### Check Services
```bash
docker compose ps
```

---

## 🎨 UI Features to Highlight

✨ **Publish Button**: Purple gradient, prominent placement  
✨ **Status Badge**: Visual indicator (Draft/Published)  
✨ **Checklist**: Pre-publish validation  
✨ **Public URL**: Copy & share functionality  
✨ **Responsive**: Works on all devices  
✨ **Real-time**: Instant status updates  

---

## 💡 Key Talking Points

1. **"One-Click Publishing"**
   - Simple, intuitive process
   - No complex configuration

2. **"Pre-publish Validation"**
   - Ensures event is ready
   - Prevents incomplete events going live

3. **"Instant Public Access"**
   - Event immediately available
   - Shareable URL generated

4. **"Status Management"**
   - Clear lifecycle: Draft → Live → Completed
   - Full control over visibility

5. **"Integrated Workflow"**
   - Seamless with other features
   - Tickets, registration, check-in all connected

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not visible | Refresh page, check login |
| Publish fails | Check API logs, verify permissions |
| Public page 404 | Ensure event is published (status=LIVE) |
| Can't access | Verify you're event owner/organizer |

---

## 📊 What Happens When Published

```
Before (DRAFT):
❌ Not visible to public
❌ No registrations accepted
❌ No public URL

After (LIVE):
✅ Public event page active
✅ Registrations open
✅ Shareable URL available
✅ Analytics tracking starts
```

---

## 🎯 Success Metrics to Show

- Event status changed: DRAFT → LIVE ✓
- Public URL generated ✓
- Registration form accessible ✓
- All CRUD operations working ✓
- Real-time updates ✓

---

**YOU'RE READY! Good luck with your demo! 🚀**

Remember: Keep it simple, focus on the user experience, and show how easy it is to publish an event!
