# Event Planner V1

A comprehensive event management platform built with Next.js 14, TypeScript, and PostgreSQL.

## 🚀 Features

- **Event Management**: Create, manage, and publish events
- **Registration System**: Online registration with QR code generation
- **Floor Plan Designer**: Interactive seat selection with drag-and-drop
- **QR Code Check-In**: Fast, contactless check-in system
- **Exhibitor Management**: Booth allocation and payment processing
- **Payment Integration**: Razorpay & Stripe support
- **Notifications**: Email, SMS, and WhatsApp notifications
- **Multi-Tenant**: Support for multiple organizations
- **Analytics**: Real-time event statistics and reports

## 📚 Documentation

- **[Complete Documentation](./DOCUMENTATION.md)** - Full system documentation
- **[API Documentation](./API_DOCUMENTATION.md)** - API endpoints and usage
- **[User Guide](./USER_GUIDE.md)** - Step-by-step user instructions

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: NextAuth.js
- **Payments**: Razorpay, Stripe
- **Notifications**: Twilio (SMS/WhatsApp), Nodemailer
- **Deployment**: Vercel

## 🏃 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database or Supabase account
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/rajasekarmohan2991/event-planner-v1.git
cd event-planner-v1/apps/web

# Install dependencies
npm install --legacy-peer-deps

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## 📖 Key Concepts

### Multi-Tenancy

The application uses a shared database with tenant isolation:
- Each organization has a unique `tenant_id`
- Prisma middleware automatically filters queries
- Default tenant: `default-tenant`

### User Roles

- **SUPER_ADMIN**: Full system access
- **ADMIN**: Tenant-level administration
- **ORGANIZER**: Event creation and management
- **EVENT_MANAGER**: Event staff
- **USER**: Regular attendee
- **EXHIBITOR**: Booth vendor

### Event Workflow

1. **Create Event** → Set details, dates, venue
2. **Setup Floor Plan** → Design seating layout (optional)
3. **Publish Event** → Make available for registration
4. **Manage Registrations** → Approve/reject attendees
5. **Event Day** → Check-in with QR codes
6. **Post-Event** → View analytics and reports

## 🔧 Configuration

### Environment Variables

Required variables in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Multi-tenancy
DEFAULT_TENANT_ID="default-tenant"

# Payment Gateways (optional)
RAZORPAY_KEY_ID="your-key"
RAZORPAY_KEY_SECRET="your-secret"
STRIPE_PUBLIC_KEY="pk_test_xxx"
STRIPE_SECRET_KEY="sk_test_xxx"

# Notifications (optional)
TWILIO_ACCOUNT_SID="your-sid"
TWILIO_AUTH_TOKEN="your-token"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"
```

## 📱 Main Features

### 1. Event Creation
Create events with detailed information, images, and settings.

### 2. Registration System
- Online registration forms
- Custom fields
- Promo code support
- Payment integration
- Automatic QR code generation

### 3. Floor Plan Designer
- Drag-and-drop interface
- Multiple table shapes
- Capacity management
- Pricing tiers (VIP, Premium, General)
- Real-time seat availability

### 4. Check-In System
- QR code scanning
- Manual search
- Real-time statistics
- Duplicate prevention

### 5. Exhibitor Management
- Application system
- Booth allocation
- Pricing and payments
- Refund processing

### 6. Notifications
- Email confirmations
- SMS check-in codes
- WhatsApp QR codes
- Event reminders

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🐛 Troubleshooting

### Common Issues

**Floor Plans Not Showing**
```sql
UPDATE floor_plans SET tenant_id = 'default-tenant' WHERE event_id = YOUR_EVENT_ID;
```

**Registrations Not Loading**
```sql
UPDATE registrations SET tenant_id = 'default-tenant' WHERE event_id = YOUR_EVENT_ID;
```

**QR Code Check-In Not Working**
- Ensure registrations have correct `tenant_id`
- Check camera permissions in browser
- Verify QR code data format

See [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed troubleshooting.

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `tenants` - Organizations
- `events` - Event information
- `registrations` - Attendee registrations
- `floor_plans` - Seating layouts
- `exhibitors` - Exhibitor applications
- `tickets` - Ticket types
- `orders` - Payment orders

See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete schema.

## 🔐 Security

- NextAuth.js for authentication
- Bcrypt password hashing
- CSRF protection
- SQL injection prevention (Prisma)
- XSS protection
- Tenant isolation

## 🧪 Testing

### Manual Testing

```bash
# Test registration
curl -X POST http://localhost:3000/api/events/22/registrations \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phone":"+919876543210"}'

# Test check-in
curl -X POST http://localhost:3000/api/events/22/check-in \
  -H "Content-Type: application/json" \
  -d '{"registrationId":"reg123"}'
```

## 📈 Performance

- Server-side rendering (SSR)
- Static generation where possible
- Image optimization
- Code splitting
- Database indexing
- Connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

Proprietary - All Rights Reserved

## 👨‍💻 Developer

**Rajasekar Mohan**
- Email: rajsam92@gmail.com
- GitHub: [@rajasekarmohan2991](https://github.com/rajasekarmohan2991)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Shadcn for beautiful UI components
- Vercel for hosting platform

## 📞 Support

For support, email rajsam92@gmail.com or open an issue on GitHub.

---

**Version**: 1.0.0  
**Last Updated**: December 26, 2025
