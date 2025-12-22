# 📊 PRODUCTION MONITORING GUIDE

## Overview
This guide helps you monitor your Event Planner application in production.

---

## 🔍 KEY METRICS TO MONITOR

### **1. Email Delivery Rates**

#### **What to Track:**
- Total emails sent
- Successful deliveries
- Bounces (hard & soft)
- Spam complaints
- Open rates (if tracking enabled)

#### **SendGrid Dashboard:**
```
1. Login to SendGrid
2. Go to: Stats → Overview
3. Monitor:
   - Delivered: Should be > 95%
   - Bounced: Should be < 5%
   - Spam Reports: Should be < 0.1%
```

#### **Application Logs:**
```bash
# Check email sending logs
grep "Email sent" logs/application.log
grep "Email failed" logs/application.log
```

#### **Database Query:**
```sql
-- Check email-related registrations
SELECT 
  COUNT(*) as total_registrations,
  COUNT(CASE WHEN data_json->>'email' IS NOT NULL THEN 1 END) as with_email,
  COUNT(CASE WHEN data_json->'payment' IS NOT NULL THEN 1 END) as with_payment
FROM registrations
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

### **2. Payment Success Rates**

#### **What to Track:**
- Total payment attempts
- Successful payments
- Failed payments
- Average transaction value
- Revenue by payment method

#### **Database Queries:**

**Payment Success Rate:**
```sql
SELECT 
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as success_rate_percent
FROM payments
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Revenue by Payment Method:**
```sql
SELECT 
  payment_method,
  COUNT(*) as transactions,
  SUM(amount_in_minor) / 100.0 as total_revenue_inr,
  AVG(amount_in_minor) / 100.0 as avg_transaction_inr
FROM payments
WHERE status = 'COMPLETED'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY payment_method
ORDER BY total_revenue_inr DESC;
```

**Daily Revenue:**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as transactions,
  SUM(amount_in_minor) / 100.0 as revenue_inr
FROM payments
WHERE status = 'COMPLETED'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### **3. User Engagement**

#### **Registration Metrics:**
```sql
-- Registrations per day
SELECT 
  DATE(created_at) as date,
  COUNT(*) as registrations,
  COUNT(DISTINCT event_id) as unique_events
FROM registrations
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### **Event Feed Activity:**
```sql
-- Feed posts per day
SELECT 
  DATE(created_at) as date,
  COUNT(*) as posts,
  COUNT(DISTINCT author_id) as unique_authors
FROM event_feed_posts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### **Seat Selection Usage:**
```sql
-- Seat reservations and bookings
SELECT 
  status,
  COUNT(*) as count,
  COUNT(DISTINCT event_id) as events
FROM seats
GROUP BY status;
```

---

## 🚨 ALERTS TO SET UP

### **Critical Alerts**

**1. Email Delivery Failure Spike**
```
Alert when: Email bounce rate > 10% in 1 hour
Action: Check SMTP configuration, verify sender reputation
```

**2. Payment Failures**
```
Alert when: Payment failure rate > 20% in 1 hour
Action: Check payment gateway status, review error logs
```

**3. Database Connection Issues**
```
Alert when: Database connection errors > 5 in 5 minutes
Action: Check database status, connection pool
```

**4. High Error Rate**
```
Alert when: 500 errors > 10 in 5 minutes
Action: Check application logs, recent deployments
```

### **Warning Alerts**

**1. Low Email Delivery**
```
Alert when: Email delivery rate < 90% for 24 hours
Action: Review email content, check spam scores
```

**2. Slow Response Times**
```
Alert when: Average response time > 2 seconds
Action: Check database queries, optimize slow endpoints
```

**3. High Memory Usage**
```
Alert when: Memory usage > 80% for 10 minutes
Action: Check for memory leaks, restart if needed
```

---

## 📈 MONITORING TOOLS

### **Option 1: Application Logs**

**Setup Logging:**
```javascript
// lib/logger.js
export function logEmail(status, to, subject, error = null) {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'email',
    status,
    to,
    subject,
    error: error?.message
  }
  console.log(JSON.stringify(log))
}

export function logPayment(status, amount, method, error = null) {
  const log = {
    timestamp: new Date().toISOString(),
    type: 'payment',
    status,
    amount,
    method,
    error: error?.message
  }
  console.log(JSON.stringify(log))
}
```

**Usage:**
```javascript
// In email sending code
try {
  await sendEmail(options)
  logEmail('success', options.to, options.subject)
} catch (error) {
  logEmail('failed', options.to, options.subject, error)
}
```

### **Option 2: Vercel Analytics** (If using Vercel)

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### **Option 3: Custom Monitoring Dashboard**

Create a simple monitoring page:

```typescript
// app/admin/monitoring/page.tsx
'use client'

import { useEffect, useState } from 'react'

export default function MonitoringPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function loadStats() {
      const res = await fetch('/api/admin/stats')
      const data = await res.json()
      setStats(data)
    }
    loadStats()
    const interval = setInterval(loadStats, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  if (!stats) return <div>Loading...</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">System Monitoring</h1>
      
      {/* Email Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <h3>Emails (24h)</h3>
          <p className="text-3xl font-bold">{stats.emails.sent}</p>
          <p className="text-sm text-green-600">
            {stats.emails.successRate}% delivered
          </p>
        </div>
        
        {/* Payment Stats */}
        <div className="p-4 border rounded">
          <h3>Payments (24h)</h3>
          <p className="text-3xl font-bold">₹{stats.payments.revenue}</p>
          <p className="text-sm text-green-600">
            {stats.payments.count} transactions
          </p>
        </div>
        
        {/* Registrations */}
        <div className="p-4 border rounded">
          <h3>Registrations (24h)</h3>
          <p className="text-3xl font-bold">{stats.registrations.count}</p>
          <p className="text-sm text-blue-600">
            {stats.registrations.events} events
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 WEEKLY REPORTS

### **Email Report Template**

```
📧 Weekly Email Report (Dec 15-22, 2025)

Total Sent: 1,234
Delivered: 1,198 (97.1%)
Bounced: 28 (2.3%)
Spam Reports: 8 (0.6%)

Top Email Types:
- Payment Confirmations: 456
- Registration Confirmations: 389
- Event Updates: 234
- Password Resets: 155

Action Items:
- Review bounced emails
- Update email templates
- Monitor spam score
```

### **Payment Report Template**

```
💳 Weekly Payment Report (Dec 15-22, 2025)

Total Revenue: ₹45,678
Transactions: 234
Success Rate: 96.2%
Failed: 9 (3.8%)

By Payment Method:
- UPI: ₹23,456 (51.3%)
- Card: ₹18,234 (39.9%)
- Cash: ₹3,988 (8.7%)

Average Transaction: ₹195

Action Items:
- Investigate failed payments
- Optimize checkout flow
- Add more payment methods
```

---

## 🔧 TROUBLESHOOTING CHECKLIST

### **Email Issues**

- [ ] Check SMTP/SendGrid credentials
- [ ] Verify sender email is verified
- [ ] Check email templates for errors
- [ ] Review spam score
- [ ] Check rate limits
- [ ] Verify DNS records (SPF, DKIM)

### **Payment Issues**

- [ ] Check payment gateway status
- [ ] Verify API credentials
- [ ] Review error logs
- [ ] Test payment flow manually
- [ ] Check webhook configuration
- [ ] Verify SSL certificate

### **Performance Issues**

- [ ] Check database query performance
- [ ] Review slow API endpoints
- [ ] Monitor memory usage
- [ ] Check for memory leaks
- [ ] Optimize large queries
- [ ] Add database indexes

---

## ✅ DAILY CHECKLIST

**Every Morning:**
- [ ] Check email delivery rate (should be > 95%)
- [ ] Review payment success rate (should be > 95%)
- [ ] Check for error spikes
- [ ] Review new registrations
- [ ] Check system health

**Every Week:**
- [ ] Generate email report
- [ ] Generate payment report
- [ ] Review user feedback
- [ ] Plan improvements
- [ ] Update documentation

---

**Monitoring Setup Time**: 30 minutes  
**Daily Monitoring Time**: 5-10 minutes  
**Tools Needed**: Database access, SendGrid dashboard, Application logs
