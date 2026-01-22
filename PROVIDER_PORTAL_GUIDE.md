# Provider Portal System - Complete User Guide

## 📚 Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Super Admin Guide](#super-admin-guide)
4. [Company Admin Guide](#company-admin-guide)
5. [Provider Management](#provider-management)
6. [Booking Management](#booking-management)
7. [Commission Tracking](#commission-tracking)
8. [Review System](#review-system)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### What is the Provider Portal?

The Provider Portal is a comprehensive vendor, sponsor, and exhibitor management system that allows event companies to:
- Manage a database of service providers
- Create and track bookings for events
- Automatically calculate and track commissions
- Rate and review provider performance
- Generate financial reports and analytics

### Key Features

✅ **Multi-Provider Support**: Vendors, Sponsors, Exhibitors  
✅ **Subscription-Based**: Enterprise-level feature  
✅ **Tenant-Scoped**: Each company has its own provider database  
✅ **Automatic Commission**: Calculated on every booking  
✅ **Review System**: Rate providers after service delivery  
✅ **Analytics Dashboard**: Track revenue and performance  
✅ **Module Gating**: Super Admin controls feature access  

---

## Getting Started

### Prerequisites

1. **Company Account**: Active tenant account
2. **Subscription Plan**: Enterprise plan required
3. **Module Access**: Super Admin must enable modules
4. **User Permissions**: Admin or higher role

### Module Activation

Modules must be enabled by Super Admin:
- Vendor Management Module
- Sponsor Management Module
- Exhibitor Management Module

---

## Super Admin Guide

### Enabling Provider Modules

1. Navigate to **Super Admin > Companies**
2. Select the company
3. Click **Provider Modules** tab
4. Toggle desired modules:
   - ✅ Vendor Management
   - ✅ Sponsor Management
   - ✅ Exhibitor Management
5. Set commission rate (default: 15%)
6. Click **Save Changes**

### Module Settings

**Commission Rate Configuration:**
- Default: 15%
- Range: 0% - 100%
- Applied to all new providers
- Can be overridden per provider

**Statistics Tracking:**
- Total vendors, sponsors, exhibitors
- Verified vs pending providers
- Total revenue generated
- Commission earned

### API Endpoint
```
GET/PUT /api/super-admin/companies/[id]/modules
```

---

## Company Admin Guide

### Accessing Provider Portal

1. Login to your company account
2. Navigate to **Providers** in sidebar
3. Select tab: Vendors | Sponsors | Exhibitors

### Dashboard Overview

**Provider Listing Page** (`/providers`)
- Tab-based navigation
- Search and filter
- Provider cards with key info
- Quick actions

**Booking Management** (`/bookings`)
- All bookings in one place
- Filter by type and status
- View commission breakdown
- Track payment status

**Commission Dashboard** (`/commissions`)
- Total earnings overview
- Monthly trends
- Top providers
- Recent transactions

---

## Provider Management

### Adding a New Provider

1. Navigate to **Providers**
2. Click **Add Provider**
3. Fill in details:
   - Provider Type (Vendor/Sponsor/Exhibitor)
   - Company Name *
   - Email *
   - Phone
   - Website
   - Location (City, State, Country)
   - Year Established
   - Description
   - Categories (at least one required)
4. Click **Add Provider**

### Provider Information

**Required Fields:**
- Company Name
- Email
- Provider Type
- At least one category

**Optional Fields:**
- Phone, Website
- Address details
- Year established
- Company description

**Categories:**
- Primary category (required)
- Additional categories (optional)
- Subcategories supported

### Provider Status

**PENDING**: Newly added, awaiting verification  
**VERIFIED**: Approved and active  
**REJECTED**: Not approved  
**SUSPENDED**: Temporarily disabled  

### Editing Providers

1. Click on provider card
2. Click **Edit** button
3. Update information
4. Click **Save Changes**

---

## Booking Management

### Creating a Vendor Booking

1. Navigate to **Bookings**
2. Select **Vendors** tab
3. Click **Create Booking**
4. Fill in details:
   - Select Event
   - Select Vendor
   - Service dates (from/to)
   - Attendee count
   - Quoted amount
   - Special requirements
5. Commission auto-calculated
6. Click **Create Booking**

### Creating a Sponsor Deal

1. Navigate to **Bookings**
2. Select **Sponsors** tab
3. Click **Create Deal**
4. Fill in details:
   - Select Event
   - Select Sponsor
   - Sponsorship Tier (Title/Platinum/Gold/Silver/Bronze)
   - Package details
   - Benefits and deliverables
   - Sponsorship amount
5. Commission auto-calculated
6. Click **Create Deal**

### Creating an Exhibitor Booking

1. Navigate to **Bookings**
2. Select **Exhibitors** tab
3. Click **Create Booking**
4. Fill in details:
   - Select Event
   - Select Exhibitor
   - Booth details (number, size, type, location)
   - Booth rental fee
   - Additional services
   - Special requirements
5. Commission auto-calculated
6. Click **Create Booking**

### Booking Lifecycle

```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
                ↓
            CANCELLED / REJECTED
```

### Payment Status

- **UNPAID**: Payment not received
- **PARTIAL**: Partial payment received
- **PAID**: Full payment received
- **REFUNDED**: Payment refunded

---

## Commission Tracking

### How Commissions Work

**Automatic Calculation:**
```
Booking Amount: ₹100,000
Commission Rate: 15%
─────────────────────────
Commission: ₹15,000
Gateway Fee (2.5%): ₹2,500
Provider Payout: ₹82,500
Platform Revenue: ₹15,000
```

### Commission Dashboard

**Overview Metrics:**
- Total commission earned
- Total bookings value
- Paid vs pending commission
- Average commission rate

**Analytics:**
- Monthly trend (last 6 months)
- Breakdown by provider type
- Top performing providers
- Recent transactions

**Filters:**
- Last 7 days
- Last 30 days
- Last 90 days
- Last year

### Commission Transactions

Each booking creates a commission transaction:
- Transaction number
- Provider details
- Booking amount
- Commission rate & amount
- Provider payout
- Status (PENDING/PAID)
- Payment reference

---

## Review System

### Submitting a Review

1. Navigate to provider profile
2. Click **Write Review**
3. Rate the provider:
   - Overall Rating (1-5 stars) *
   - Quality Rating
   - Communication Rating
   - Value for Money Rating
   - Professionalism Rating
4. Write review:
   - Review Title
   - Review Text
   - Pros
   - Cons
5. Click **Submit Review**

### Review Display

**Provider Profile Shows:**
- Average rating
- Total reviews
- Rating distribution (5-star to 1-star)
- Individual reviews with details
- Provider responses

### Review Guidelines

✅ **Do:**
- Be honest and constructive
- Provide specific examples
- Rate fairly based on experience
- Update review if situation changes

❌ **Don't:**
- Use offensive language
- Share personal information
- Post fake reviews
- Violate terms of service

---

## API Reference

### Provider APIs

**List Providers**
```
GET /api/companies/[tenantId]/providers
Query Params: type, status, search, page, limit
```

**Create Provider**
```
POST /api/companies/[tenantId]/providers
Body: { providerType, companyName, email, categories, ... }
```

### Booking APIs

**Vendor Bookings**
```
GET/POST /api/companies/[tenantId]/bookings/vendors
```

**Sponsor Deals**
```
GET/POST /api/companies/[tenantId]/bookings/sponsors
```

**Exhibitor Bookings**
```
GET/POST /api/companies/[tenantId]/bookings/exhibitors
```

### Commission APIs

**Dashboard**
```
GET /api/companies/[tenantId]/commissions/dashboard
Query Params: period (7, 30, 90, 365)
```

### Review APIs

**Provider Reviews**
```
GET/POST /api/companies/[tenantId]/providers/[providerId]/reviews
```

---

## Troubleshooting

### Module Not Enabled

**Error**: "This feature is not available in your plan"

**Solution**:
1. Contact Super Admin
2. Request module activation
3. Verify Enterprise subscription

### Provider Not Found

**Error**: "Provider not found or not active"

**Solution**:
1. Check provider status (must be VERIFIED)
2. Verify provider belongs to your company
3. Check provider is not suspended

### Commission Calculation Issues

**Issue**: Incorrect commission amount

**Solution**:
1. Verify commission rate in settings
2. Check provider-specific rate override
3. Review booking amount entered
4. Contact support if issue persists

### Booking Creation Failed

**Error**: "Failed to create booking"

**Solution**:
1. Verify event exists and belongs to company
2. Check provider is active and verified
3. Ensure all required fields filled
4. Verify module is enabled
5. Check network connection

---

## Best Practices

### Provider Management

1. **Verify Providers**: Review and verify new providers promptly
2. **Keep Updated**: Maintain current contact information
3. **Regular Reviews**: Rate providers after each service
4. **Clear Categories**: Use consistent category naming

### Booking Management

1. **Detailed Requirements**: Specify all requirements upfront
2. **Timely Confirmation**: Confirm bookings quickly
3. **Track Status**: Monitor booking progress
4. **Document Everything**: Keep records of communications

### Commission Tracking

1. **Regular Audits**: Review commission reports monthly
2. **Reconcile Payments**: Match payments to transactions
3. **Monitor Trends**: Track performance over time
4. **Budget Planning**: Use data for future planning

---

## Support

### Getting Help

**Documentation**: This guide and system documentation  
**API Docs**: `/api/docs` endpoint  
**Support Email**: support@yourplatform.com  
**Admin Portal**: Contact Super Admin for module issues  

### Feature Requests

Submit feature requests through:
1. Admin dashboard feedback form
2. Support email
3. Company admin portal

---

## Changelog

### Version 1.0.0 (Current)
- ✅ Provider management (Vendors, Sponsors, Exhibitors)
- ✅ Booking creation and tracking
- ✅ Automatic commission calculation
- ✅ Commission dashboard and analytics
- ✅ Review and rating system
- ✅ Super Admin module control
- ✅ Tenant-scoped data isolation

### Upcoming Features
- 🔄 Provider portal (separate login)
- 🔄 Email notifications
- 🔄 Contract management
- 🔄 Payment gateway integration
- 🔄 Advanced analytics
- 🔄 Mobile app support

---

## Quick Reference

### Default Commission Rates

| Provider Type | Default Rate | Range |
|--------------|--------------|-------|
| Vendor       | 15%          | 8-15% |
| Sponsor      | 10%          | 5-15% |
| Exhibitor    | 18%          | 15-20% |

### Booking Status Flow

```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
```

### Payment Status

```
UNPAID → PARTIAL → PAID
```

### Provider Status

```
PENDING → VERIFIED (or REJECTED)
VERIFIED → SUSPENDED (if needed)
```

---

**Last Updated**: January 22, 2026  
**Version**: 1.0.0  
**System**: Event Planner V1 - Provider Portal Module
