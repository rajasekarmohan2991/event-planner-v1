import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import CompanyListClient from "@/components/admin/CompanyListClient";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SuperAdminCompaniesPage() {
  const session = await getServerSession(authOptions as any);

  if (!session?.user) {
    redirect("/signin");
  }

  // Optimize: Fetch data in parallel
  const [companies, systemLogoResult] = await Promise.all([
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        billingEmail: true,
        emailFromAddress: true,
        logo: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            events: true // We can count events directly here
          }
        },
        members: {
          where: { role: 'TENANT_ADMIN' },
          take: 1,
          select: {
            user: {
              select: { email: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.$queryRaw<any[]>`SELECT value FROM system_settings WHERE key = 'company_logo' LIMIT 1`.catch(() => [])
  ]);

  const systemLogo = systemLogoResult?.[0]?.value || null;

  // Process data to match plain object structure for client component
  // We need to map it carefully to avoid passing Date objects if using older Next.js serialization,
  // but newer Next.js handles Dates better. Safest to toString them.

  const formattedCompanies = companies.map(c => {
    // Priority: Billing Email -> Email From Address -> Tenant Admin Email -> System Email -> Placeholder
    const adminEmail = c.members[0]?.user.email;
    let fallbackEmail = c.billingEmail || c.emailFromAddress || adminEmail || process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || `support@${c.slug}.com`;

    // Extract email if format is "Name <email>"
    const emailMatch = fallbackEmail?.match(/<([^>]+)>/);
    if (emailMatch) {
      fallbackEmail = emailMatch[1];
    }

    // Use system logo for Super Admin company
    const companyLogo = (c.slug === 'super-admin' || c.slug === 'default-tenant') ? (systemLogo || c.logo) : c.logo;

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      plan: c.plan,
      status: c.status,
      billingEmail: fallbackEmail,
      createdAt: c.createdAt.toISOString(),
      logo: companyLogo,
      _count: {
        members: c._count.members
      },
      eventCount: c._count.events
    };
  });

  // Sort: "super-admin" slug first, then others
  const sortedCompanies = formattedCompanies.sort((a, b) => {
    const isSuperA = a.slug === 'super-admin' || a.slug === 'default-tenant';
    const isSuperB = b.slug === 'super-admin' || b.slug === 'default-tenant';
    if (isSuperA && !isSuperB) return -1;
    if (!isSuperA && isSuperB) return 1;
    return 0;
  });

  return <CompanyListClient initialCompanies={sortedCompanies} />;
}
