# 🚀 QUICK TEST FOR DEMO - 15 MINS

## ✅ FIXES APPLIED

### 1. Image Upload Permission Fixed
- Fixed EACCES permission denied error
- Upload directory now has correct permissions
- **TEST**: Try uploading image now - should work!

### 2. Events Listing Debug Added
- Added logging to see tenant/role being sent
- Check browser console and terminal for logs

---

## 🔥 TEST NOW (2 MINUTES)

### Step 1: Hard Refresh Browser
**Mac**: `Cmd + Shift + R`  
**Windows**: `Ctrl + Shift + R`

### Step 2: Test Image Upload
1. Go to **Create Event** → Step 4 (Media)
2. Click **Upload Image**
3. Select ANY image file
4. **Expected**: Should upload successfully now!
5. Check browser console for "✅ Image upload success"

### Step 3: Check Events List
1. Go to **http://localhost:3001/events**
2. Open browser console (F12)
3. Look for log: `🔍 GET /api/events - tenant: ..., role: ...`
4. **If events still not showing**: Tell me what the log says!

---

## 📊 Database Has 4 Events

```
event planner 001 (London)
event 8733 (London)  
new doll event (london)
TECH SAVYY200 (London)
```

All have `tenant_id='default-tenant'`

---

## 🐛 If Events Still Not Showing

Check browser console for the log line that starts with `🔍 GET /api/events`

Tell me:
1. What is the **tenant** value?
2. What is the **role** value?
3. What is the **user** email?

This will tell me exactly what's wrong!

---

## ⚡ Quick Commands

```bash
# See web logs in real-time
docker compose logs -f web

# See what's in uploads folder
docker compose exec web ls -la /app/public/uploads

# Check database
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT id, name, tenant_id FROM events;"
```

---

**Status**: 🟢 Image upload fixed, events listing debugging added

**Next**: Test image upload first (should work now!), then check console for events list debug info
