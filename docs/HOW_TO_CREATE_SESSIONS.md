# 📅 How to Create Sessions for Your Event

## ✅ **Good News: Sessions Feature is Already Implemented!**

The sessions functionality is fully built and ready to use. Here's how to create sessions for your events.

---

## 🚀 **How to Create Sessions**

### **Step 1: Navigate to Sessions Page**

```bash
# Open your event
http://localhost:3001/events/[EVENT_ID]/sessions

# Example:
http://localhost:3001/events/1/sessions
```

**Or navigate through the UI:**
1. Go to your event page
2. Click "Sessions" in the management tabs
3. Or click "Agenda" or "Sessions" from the event overview

---

### **Step 2: Fill in Session Details**

The sessions page has a form with these fields:

#### **Required Fields:**
- ✅ **Title**: Session name (e.g., "Opening Keynote")
- ✅ **Start Time**: When the session begins
- ✅ **End Time**: When the session ends

#### **Optional Fields:**
- **Description**: Details about the session
- **Track**: Category or track (e.g., "Main", "Technical", "Business")
- **Room**: Location (e.g., "Hall A", "Room 101")
- **Capacity**: Maximum attendees

---

### **Step 3: Click "Add Session"**

The session will be created and appear in the list below the form.

---

## 🎯 **Example: Creating a Session**

### **Sample Session Data:**

```
Title: Opening Keynote
Description: Welcome address and event overview
Start Time: 2025-10-22 09:00
End Time: 2025-10-22 10:00
Room: Main Hall
Track: Keynote
Capacity: 500
```

### **What Happens:**
1. ✅ Session is created in the database
2. ✅ Appears in the sessions list
3. ✅ Can be edited or deleted
4. ✅ Can attach speakers to the session

---

## 🔧 **Session Management Features**

### **After Creating a Session:**

#### **1. Edit Session**
- Click the edit button on any session
- Update any field
- Save changes

#### **2. Delete Session**
- Click the delete button
- Confirm deletion
- Session is removed

#### **3. Attach Speakers**
- Each session can have multiple speakers
- Select a speaker from the dropdown
- Click "Attach Speaker"
- Speakers appear in the session details

#### **4. Detach Speakers**
- Click "Detach" next to any speaker
- Speaker is removed from that session

---

## 📊 **Sessions API Endpoints**

All working and ready to use:

### **Frontend Routes:**
- `GET /api/events/[id]/sessions` - List all sessions
- `POST /api/events/[id]/sessions` - Create new session
- `PUT /api/events/[id]/sessions/[sessionId]` - Update session
- `DELETE /api/events/[id]/sessions/[sessionId]` - Delete session
- `POST /api/events/[id]/sessions/[sessionId]/speakers/[speakerId]` - Attach speaker
- `DELETE /api/events/[id]/sessions/[sessionId]/speakers/[speakerId]` - Detach speaker

### **Backend (Java) Endpoints:**
All implemented in `SessionController.java`

---

## 🧪 **Testing Sessions**

### **Test Now:**

```bash
# 1. Make sure app is running
docker compose ps

# 2. Open sessions page
open http://localhost:3001/events/1/sessions

# 3. Create a test session:
Title: Test Session
Start: [Select today + 1 hour]
End: [Select today + 2 hours]
Click "Add Session"
```

---

## ✅ **What's Already Working:**

- ✅ **Sessions page UI** - Form and list view
- ✅ **Create sessions** - With all fields
- ✅ **Edit sessions** - Update any field
- ✅ **Delete sessions** - Remove sessions
- ✅ **List sessions** - Paginated view
- ✅ **Attach speakers** - Link speakers to sessions
- ✅ **Validation** - End time must be after start time
- ✅ **Authorization** - Uses your access token
- ✅ **Backend API** - Java Spring Boot endpoints

---

## 🎬 **Quick Start Guide:**

### **Create Your First Session:**

1. **Open sessions page:**
   ```
   http://localhost:3001/events/1/sessions
   ```

2. **Fill in the form:**
   - Title: "Welcome Session"
   - Start: Tomorrow at 9:00 AM
   - End: Tomorrow at 10:00 AM
   - Room: "Main Hall"

3. **Click "Add Session"**

4. **Done!** ✅ Your session is created

---

## 🐛 **Troubleshooting:**

### **If sessions don't appear:**

1. **Check you're logged in:**
   ```bash
   # Sessions require authentication
   # Make sure you're signed in
   ```

2. **Check the event ID:**
   ```bash
   # Make sure you're using a valid event ID
   # Example: /events/1/sessions
   ```

3. **Check browser console:**
   ```bash
   # Open DevTools (F12)
   # Look for any error messages
   ```

4. **Check backend is running:**
   ```bash
   docker compose ps
   # Make sure eventplannerv1-api-1 is "Up"
   ```

---

## 📋 **Session Fields Reference:**

| Field | Type | Required | Example |
|-------|------|----------|---------|
| Title | String | ✅ Yes | "Opening Keynote" |
| Description | Text | No | "Welcome and overview" |
| Start Time | DateTime | ✅ Yes | "2025-10-22T09:00" |
| End Time | DateTime | ✅ Yes | "2025-10-22T10:00" |
| Room | String | No | "Hall A" |
| Track | String | No | "Main" |
| Capacity | Number | No | 500 |

---

## 🎯 **Summary:**

**Sessions are fully functional!** You can:
- ✅ Create sessions with all details
- ✅ Edit and delete sessions
- ✅ Attach speakers to sessions
- ✅ View all sessions in a list
- ✅ Everything is working and ready to use

**Just navigate to:**
```
http://localhost:3001/events/[YOUR_EVENT_ID]/sessions
```

**And start creating sessions!** 🎉

---

## 🚀 **Next Steps:**

1. **Create your first session** (follow steps above)
2. **Add speakers** (if you have any)
3. **Create more sessions** to build your agenda
4. **Test the full workflow**

**Everything is ready to go!** ✅
