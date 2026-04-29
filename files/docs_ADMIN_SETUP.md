# Admin Dashboard Setup & Usage

## Overview
The admin dashboard is a single-page app that lets you:
- 👀 View all fan requests in real-time
- 🔍 Filter by status, package type, phone/email
- ✏️ Edit request status (new → paid → completed)
- 📊 Track stats (total requests, revenue, pending calls, completion rate)
- 💬 Send bulk SMS reminders
- ✅ Mark requests as complete

---

## Deployment

### 1. Copy Files
```bash
cp admin/dashboard.html /your-web-root/admin/
cp admin/login.html /your-web-root/admin/
```

### 2. Update Supabase Credentials
In `admin/dashboard.html`, update:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
```

Get these from Supabase Dashboard:
1. Go to **Settings** → **API**
2. Copy **Project URL** (SUPABASE_URL)
3. Copy **anon public** key (SUPABASE_KEY)

### 3. Enable RLS (Row-Level Security)
For security, enable RLS on tables:

```sql
-- Enable RLS
ALTER TABLE fan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;

-- Create admin role
CREATE ROLE admin_user;

-- Policy: Only admins can read
CREATE POLICY "Admin read only" ON fan_requests
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Policy: Only admins can update
CREATE POLICY "Admin update only" ON fan_requests
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );
```

### 4. Create Admin User Table
```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin', -- admin, moderator, readonly
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invite first admin (replace with your email)
INSERT INTO admin_users (user_id, email) 
VALUES (auth.uid(), 'your-email@example.com');
```

### 5. Set Up Authentication
Use Supabase Auth or custom token:

**Option A: Supabase Auth (Recommended)**
```javascript
// In dashboard.html
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  window.location.href = '/admin/login.html';
}
```

**Option B: Simple Token (For MVP)**
```javascript
// In login.html
function login(email, password) {
  const token = btoa(`${email}:${password}`); // Simple base64 encoding
  localStorage.setItem('admin_token', token);
  window.location.href = '/admin/dashboard.html';
}
```

---

## Features

### Dashboard Overview
```
📊 Stats Row:
  - Total Requests: 42
  - Paid This Week: 8 (+$450 revenue)
  - Pending Calls: 3 (voice/video packages awaiting booking)
  - Completion Rate: 75% (completed / paid)
```

### Filters
- **Status**: new, consented, package_selected, checkout_sent, paid, scheduling_sent, completed
- **Package**: text list, fan drop, priority text, real lexi, voice, video, vip
- **Search**: Phone number or email (partial match)

### Request Table
| Column | Details |
|--------|---------|
| Phone | Customer phone number (E.164 format) |
| Package | Type of package selected |
| Amount | Price ($9-$199) |
| Status | Current state in funnel |
| Created | When request was initiated |
| Paid | When payment succeeded (if paid) |
| Actions | Edit, Mark Complete |

### Edit Request
Click **Edit** to:
- Change status (e.g., paid → scheduling_sent → completed)
- Add internal notes
- Save changes

### Mark Complete
Click **✓ Done** to:
- Instantly mark request as `completed`
- Set `completed_at` timestamp
- Update completion rate stats

---

## Usage Workflows

### Workflow 1: Track Pending Calls
```
1. Filter by Status: "paid"
2. Filter by Package: "voice10" or "video20"
3. Review Pending Calls count
4. For each request:
   a. Click Edit
   b. Check if user booked via Calendly
   c. If booked, change status to "scheduling_sent"
   d. If not booked after 3 days, send SMS reminder
```

### Workflow 2: Send Bulk SMS Reminder
```
1. Filter by Status: "paid"
2. Filter by Package: "voice10" or "video20"
3. Select all visible requests (TODO: implement multi-select)
4. Click "Send Reminder SMS"
5. Confirm: "Ready to send SMS to 5 users?"
6. SMS template: "📅 Reminder: Book your call! [Calendly link]"
```

### Workflow 3: Daily Standup
```
1. Refresh dashboard (Cmd+R)
2. Check:
   - Total Requests (up from yesterday?)
   - Paid This Week revenue (on track?)
   - Pending Calls (which ones need follow-up?)
   - Completion Rate (are people booking calls?)
3. Sort by Created (newest first)
4. Identify any "stuck" requests (in "checkout_sent" for >24h)
5. Send SMS nudge: "Need help? Reply 'HELP' to see your options again."
```

### Workflow 4: Mark Request Complete
```
1. User replies "I had the call, thanks!"
2. Search for their phone number
3. Click "✓ Done"
4. Status changes to "completed"
5. Completion rate updates automatically
```

---

## Bulk Operations (TODO: Implement)

### Send Bulk SMS
```javascript
// TODO: Add this feature
async function sendBulkSMS(requestIds, messageTemplate) {
  for (const requestId of requestIds) {
    const request = await getRequest(requestId);
    const message = messageTemplate.replace('[LINK]', request.calendly_link);
    await sendSMS(request.phone_number, message);
  }
}
```

### Export to CSV
```javascript
// TODO: Add this feature
async function exportToCSV() {
  const csv = filteredRequests.map(r => 
    `${r.phone_number},${r.package_type},${r.status},${r.paid_at}`
  ).join('\n');
  download(csv, 'requests.csv');
}
```

---

## Stats Explanation

### Total Requests
All fan requests (including new, consented, not-yet-paid).

### Paid This Week
Requests with `status = paid` in the last 7 days.
**Revenue** = sum of package prices.

**Formula:**
```sql
SELECT 
  COUNT(*) as paid_count,
  SUM(package_price) as revenue
FROM fan_requests
WHERE status = 'paid'
  AND paid_at >= NOW() - INTERVAL '7 days';
```

### Pending Calls
Requests where:
- Package = voice10, video20, or vip
- Status = paid (payment received but not yet scheduled)

**Action item**: These users need Calendly link reminder.

### Completion Rate
Percentage of paid requests that are marked complete.

**Formula:**
```
(completed count / paid count) × 100
```

**Targets:**
- 75%+ = good (most users follow through)
- <50% = problem (users abandoning after payment)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Can't load requests" | Check Supabase credentials in dashboard.html. Verify RLS is enabled. |
| "Edit button does nothing" | Check browser console (F12). Verify Supabase key has write permissions. |
| Table is empty | Filter might be too restrictive. Click Refresh. Check if Supabase has data. |
| Stats are wrong | Click Refresh. Wait 5 seconds for data to load. Check date filters. |
| SMS not sending | Verify Twilio credentials in backend. Check phone number format (E.164). |

---

## Database Queries (For Manual Audit)

### View All Requests
```sql
SELECT 
  phone_number, 
  package_type, 
  status, 
  paid_at, 
  created_at
FROM fan_requests
ORDER BY created_at DESC;
```

### Revenue Report
```sql
SELECT 
  DATE_TRUNC('day', paid_at) as day,
  COUNT(*) as count,
  SUM(CASE 
    WHEN package_type = 'textList' THEN 9
    WHEN package_type = 'fanDrop' THEN 19
    WHEN package_type = 'priorityText' THEN 29
    WHEN package_type = 'realLexiText' THEN 49
    WHEN package_type = 'voice10' THEN 49
    WHEN package_type = 'video20' THEN 99
    WHEN package_type = 'vip' THEN 199
  END) as revenue
FROM fan_requests
WHERE status IN ('paid', 'scheduling_sent', 'completed')
GROUP BY DATE_TRUNC('day', paid_at)
ORDER BY day DESC;
```

### Stuck Requests (>24h without status change)
```sql
SELECT 
  phone_number, 
  package_type, 
  status, 
  created_at,
  EXTRACT(HOUR FROM NOW() - updated_at) as hours_stuck
FROM fan_requests
WHERE status IN ('checkout_sent', 'package_selected')
  AND updated_at < NOW() - INTERVAL '24 hours'
ORDER BY updated_at ASC;
```

---

## Security

### ✅ DO
- Use Supabase RLS (Row-Level Security)
- Authenticate admin users via Supabase Auth
- Log all admin actions (TODO: implement audit log)
- Use HTTPS only (no http://)

### ❌ DON'T
- Put admin credentials in frontend code
- Allow unauthenticated access to dashboard
- Expose Stripe/Twilio keys via API
- Store passwords in plain text (use Supabase Auth)

---

## Future Enhancements

- [ ] Multi-select requests for bulk operations
- [ ] Export to CSV
- [ ] SMS templates (customizable)
- [ ] Calendar view of scheduled calls (Calendly integration)
- [ ] Revenue charts (Chart.js)
- [ ] Audit log (who changed what when)
- [ ] Bulk SMS scheduling (send at specific time)
- [ ] Customer notes (private, per-request)
- [ ] Two-factor auth (2FA)
