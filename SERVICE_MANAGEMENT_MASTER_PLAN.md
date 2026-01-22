# Service Management Implementation Plan

## Overview
This plan details the upgrade of the **Service Management Module** to support advanced Catering (Vendor), Exhibitor, and Sponsor workflows. This moves the platform towards an enterprise-grade Event Marketplace.

## 1. Vendor Module – Advanced Structure (Catering Focus)

### A. Vendor Profile (Company Level)
Upgrading the `Vendor` model to include:
- **Identity:** Logo, Cover Banner, Year Established.
- **Operations:** Operating Cities/Regions (Multi-select), Service Capacity (e.g., max 500 guests).
- **Compliance:** Certifications/Licenses (File uploads).
- **Schedule:** Availability Calendar.
- **Social:** Ratings & Reviews (Future).

### B. Services (Structured Sub-Modules)
Each vendor can have multiple services (e.g., "Wedding Catering - Premium").
- **Attributes:** Service Type (Full Service, Drop Catering, etc.), Price Model (Per Plate, Per Event), Base Price, Min/Max Order, Prep Time, Staff Count.

### C. Menu & Meal Structure (Hierarchy)
**Service** -> **Menu Categories** -> **Menu Items**
- **Menu Item:** Name, Type (Veg/Non-Veg), Course (Starter/Main), Cuisine, Image, Price Impact, Allergens, Customizable flag.

### D. Meal Packages (Bundles)
- **Package:** Name, Type (Breakfast/Lunch), Included Items Count (e.g., 3 Starters, 4 Mains), Price Per Plate, Min/Max Guests.
- **Rules:** Substitution rules (e.g., +₹50 for extra item).

### E. Media & Animation
- **Gallery:** Food images, Setup images, Live counters, Videos.

### F. Booking & Payment Flow
- **Booking Record:** Service Selection, Package/Custom Menu, Event Details, Guest Count.
- **Financials:** Amount Breakdown (Base + Extra + Tax + Fee), Payment Status (Advance, Balance).

## 2. Exhibitor Module – Advanced Plan

### A. Enhancements to Profile
- Logo, Brand Description, Social Links, Past Gallery.

### B. Booth Configuration
- Booth Type (Standard, Island), Size, Layout, Inclusions (Tables, Power, etc.), 3D Preview (Future).

### C. Product Showcase
- **Product Catalog:** Name, Category, Description, Images, Demo Video, Brochure PDF.

## 3. Sponsor Module – New Implementation

### A. Sponsor Profile
- Company Logo, Industry, Website, Past Sponsorships.

### B. Sponsorship Packages
- Tiers (Gold, Silver), Price, Benefits (Logo on stage, Speaking slot), Deliverables Checklist.

### C. Assets management
- Upload workflow for Logos, Banners, Ads with Approval status.

## 4. Cross-Cutting Features
- **File Management:** CDN support, Compression.
- **Approvals:** Status workflow (Draft -> Submitted -> Approved -> Rejected).
- **Versioning:** History tracking for prices/menus.

---

## Technical Implementation: Database Schema

We will introduce the following tables to `schema.prisma`.

### Vendor Module Tables

```prisma
model Vendor {
  id              String   @id @default(cuid())
  tenantId        String?  @map("tenant_id")
  name            String
  category        String   // Catering, Decor, AV
  description     String?  @db.Text
  email           String?
  phone           String?
  website         String?
  
  // Advanced Profile
  logo            String?
  coverImage      String?  @map("cover_image")
  establishedYear Int?     @map("established_year")
  operatingCities Json?    // Array of strings
  serviceCapacity Int?     @map("service_capacity") // Max guests
  licenses        Json?    // Array of { title, url }
  
  rating          Float    @default(0)
  reviewCount     Int      @default(0)
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  services        VendorService[]
  bookings        VendorBooking[]
  
  @@index([tenantId])
  @@index([category])
  @@map("vendors")
}

model VendorService {
  id              String   @id @default(cuid())
  vendorId        String   @map("vendor_id")
  name            String
  type            String   // Full Service, Buffet, etc.
  priceModel      String   // Per Plate, Per Event
  basePrice       Decimal  @db.Decimal(10, 2) @map("base_price")
  currency        String   @default("INR")
  minOrderQty     Int      @default(1) @map("min_order_qty")
  maxCapacity     Int?     @map("max_capacity")
  prepTimeHours   Int?     @map("prep_time_hours")
  staffCount      Int      @default(0) @map("staff_count")
  
  description     String?  @db.Text
  isPopular       Boolean  @default(false) @map("is_popular")
  
  vendor          Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  categories      MenuCategory[]
  packages        MealPackage[]
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([vendorId])
  @@map("vendor_services")
}

model MenuCategory {
  id              String   @id @default(cuid())
  serviceId       String   @map("service_id")
  name            String   // Starters, Mains, Desserts
  description     String?
  sortOrder       Int      @default(0) @map("sort_order")
  
  service         VendorService @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  items           MenuItem[]

  @@map("menu_categories")
}

model MenuItem {
  id              String   @id @default(cuid())
  categoryId      String   @map("category_id")
  name            String
  type            String   // VEG, NON_VEG, VEGAN
  cuisine         String?  // Indian, Chinese
  description     String?
  imageUrls       Json?    // Array of strings
  allergens       Json?    // Array of strings
  
  priceImpact     Decimal  @default(0) @db.Decimal(10, 2) @map("price_impact")
  isCustomizable  Boolean  @default(false) @map("is_customizable")
  
  category        MenuCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@map("menu_items")
}

model MealPackage {
  id              String   @id @default(cuid())
  serviceId       String   @map("service_id")
  name            String
  type            String   // Breakfast, Lunch, Dinner
  pricePerPlate   Decimal  @db.Decimal(10, 2) @map("price_per_plate")
  minGuests       Int      @default(10) @map("min_guests")
  maxGuests       Int?     @map("max_guests")
  
  description     String?
  includedItems   Json?    // Summary of what is included (e.g., {"Starters": 3, "Mains": 4})
  
  service         VendorService @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@map("meal_packages")
}

model VendorBooking {
  id              String   @id @default(cuid())
  vendorId        String   @map("vendor_id")
  serviceId       String   @map("service_id")
  eventId         String?  @map("event_id")
  userId          BigInt?  @map("user_id") // Who booked
  
  bookingDate     DateTime @map("booking_date")
  guestCount      Int      @map("guest_count")
  
  status          String   @default("PENDING") // PENDING, CONFIRMED, COMPLETED, CANCELLED
  
  // Financials
  baseAmount      Decimal  @db.Decimal(10, 2) @map("base_amount")
  taxAmount       Decimal  @default(0) @db.Decimal(10, 2) @map("tax_amount")
  totalAmount     Decimal  @db.Decimal(10, 2) @map("total_amount")
  advancePaid     Decimal  @default(0) @db.Decimal(10, 2) @map("advance_paid")
  
  notes           String?
  
  vendor          Vendor         @relation(fields: [vendorId], references: [id])
  service         VendorService  @relation(fields: [serviceId], references: [id])

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("vendor_bookings")
}
```

### Exhibitor Module Enhancements

We will add `ExhibitorProduct` model.

```prisma
model ExhibitorProduct {
  id              String   @id @default(cuid())
  exhibitorId     String   @map("exhibitor_id")
  name            String
  category        String?
  description     String?  @db.Text
  price           Decimal? @db.Decimal(10, 2)
  imageUrls       Json?
  videoUrl        String?  @map("video_url")
  brochureUrl     String?  @map("brochure_url")
  
  exhibitor       Exhibitor @relation(fields: [exhibitorId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("exhibitor_products")
}
```

### Sponsor Module Tables

```prisma
model Sponsor {
  id              String   @id @default(cuid())
  eventId         String   @map("event_id")
  name            String
  industry        String?
  website         String?
  logo            String?
  description     String?  @db.Text
  
  // Contact
  contactName     String?  @map("contact_name")
  contactEmail    String?  @map("contact_email")
  contactPhone    String?  @map("contact_phone")
  
  status          String   @default("ACTIVE")
  
  event           Event    @relation(fields: [eventId], references: [id]) // Assuming related to Event directly? Or Tenant? 
  // User context implies Event-based sponsors mostly.
  
  packages        SponsorshipPackage[]
  assets          SponsorAsset[]
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([eventId])
  @@map("sponsors")
}

model SponsorshipPackage {
  id              String   @id @default(cuid())
  sponsorId       String?  @map("sponsor_id") // Can be template or specific
  eventId         String?  @map("event_id")   // If template
  
  name            String   // Gold, Title
  price           Decimal  @db.Decimal(10, 2)
  benefits        Json?    // Array of benefits
  deliverables    Json?    // Checklist
  
  sponsor         Sponsor? @relation(fields: [sponsorId], references: [id])
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("sponsorship_packages")
}

model SponsorAsset {
  id              String   @id @default(cuid())
  sponsorId       String   @map("sponsor_id")
  type            String   // LOGO, BANNER, VIDEO
  url             String
  status          String   @default("PENDING") // PENDING, APPROVED, REJECTED
  
  sponsor         Sponsor  @relation(fields: [sponsorId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@map("sponsor_assets")
}
```
