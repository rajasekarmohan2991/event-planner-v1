"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    phone: "",
    industry: "",
    country: "",
    registrationNumber: "",
    address: "",
    adminName: "",
    adminEmail: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/company/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to register company");
      }

      setSuccess("Company registered successfully. You can now sign in.");
      // Optional: redirect after short delay
      // setTimeout(() => router.push("/auth/signin"), 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900 text-center">
          Company Registration
        </h1>
        <p className="text-sm text-slate-600 text-center">
          Create your company account and admin user.
        </p>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Company Name
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Company Email
            </label>
            <input
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.companyEmail}
              onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                type="tel"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Industry
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              >
                <option value="">Select industry</option>
                <option value="IT">IT / Software</option>
                <option value="Finance">Finance / Banking</option>
                <option value="Education">Education</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail / E‑Commerce</option>
                <option value="Media">Media / Entertainment</option>
                <option value="Events">Events / Hospitality</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Country
            </label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            >
              <option value="">Select country</option>
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="SG">Singapore</option>
              <option value="AE">United Arab Emirates</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="BR">Brazil</option>
              <option value="ZA">South Africa</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Company Registration Number
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Company Address
            </label>
            <textarea
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Admin Name
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.adminName}
              onChange={(e) => setForm({ ...form, adminName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Admin Email
            </label>
            <input
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register Company"}
          </button>
        </form>
      </div>
    </div>
  );
}
