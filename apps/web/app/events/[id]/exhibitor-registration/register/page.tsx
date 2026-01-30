"use client"
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { Building2, User, Phone, Mail, MapPin, FileText, CreditCard, CheckSquare } from 'lucide-react'
import { ALL_COUNTRIES } from '@/lib/countries'

const POPULAR_CITIES_BY_COUNTRY: Record<string, string[]> = {
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur'],
  'USA': ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Miami', 'Seattle'],
  'UK': ['London', 'Manchester', 'Birmingham', 'Glasgow'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  'Singapore': ['Singapore'],
}

export default function ExhibitorRegistrationForm() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [customCountry, setCustomCountry] = useState(false)
  const [customCity, setCustomCity] = useState(false)

  const [formData, setFormData] = useState({
    // Company Information
    company_name: '',
    brand_name: '',
    company_description: '',
    industry_category: '',
    website_url: '',
    company_logo_url: '',
    country: '',
    address: '',
    city: '',
    state_province: '',
    postal_code: '',

    // Contact Person
    contact_name: '',
    contact_designation: '',
    contact_email: '',
    contact_phone: '',
    alt_contact_name: '',
    alt_contact_email: '',
    alt_contact_phone: '',

    // Booth Details
    booth_type: 'Standard',
    booth_size: '3x3',
    number_of_booths: 1,
    preferred_location: '',
    extra_tables: 0,
    extra_chairs: 0,
    power_supply: false,
    lighting: false,
    internet_connection: false,
    storage_space: false,
    branding_requirements: '',

    // Products/Services
    products_services: '',
    special_approval_items: '',

    // Documentation
    registration_certificate_url: '',
    tax_id: '',
    business_license_url: '',
    identity_proof_url: '',

    // Marketing
    social_media_links: '',
    promotional_material_url: '',
    promotion_consent: false,

    // Terms
    terms_accepted: false,
    refund_policy_accepted: false,
    safety_rules_accepted: false,
    privacy_policy_accepted: false,

    // Payment
    payment_method: 'Credit Card',
    payment_proof_url: '',
    billing_address: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.company_name || !formData.contact_name || !formData.contact_email || !formData.contact_phone) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields marked with *",
        variant: "destructive"
      })
      return
    }

    if (!formData.terms_accepted) {
      toast({
        title: "Terms Not Accepted",
        description: "Please accept the terms and conditions",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/events/${params.id}/exhibitors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: params.id,
          ...formData,
          social_media_links: formData.social_media_links ? JSON.parse(formData.social_media_links) : {},
        })
      })

      if (!response.ok) throw new Error('Registration failed')

      toast({
        title: "Registration Submitted!",
        description: "Your exhibitor registration has been submitted for approval.",
      })

      router.push(`/events/${params.id}/exhibitor-registration`)
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Please try again later",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Exhibitor Registration Form</h1>
            <p className="text-gray-600">Please fill in all required information to register as an exhibitor</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Company Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brand_name}
                    onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
                  <textarea
                    value={formData.company_description}
                    onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry/Category</label>
                  <select
                    value={formData.industry_category}
                    onChange={(e) => setFormData({ ...formData, industry_category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  {customCountry ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter Country"
                      />
                      <button
                        type="button"
                        onClick={() => { setCustomCountry(false); setFormData({ ...formData, country: '' }) }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Select
                      </button>
                    </div>
                  ) : (
                    <select
                      value={formData.country}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Other') {
                          setCustomCountry(true);
                          setFormData({ ...formData, country: '', city: '' });
                        } else {
                          setFormData({ ...formData, country: val, city: '' });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Country</option>
                      {ALL_COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                      <option value="Other">Other</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  {customCity || customCountry || !POPULAR_CITIES_BY_COUNTRY[formData.country] ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter City"
                      />
                      {!customCountry && POPULAR_CITIES_BY_COUNTRY[formData.country] && (
                        <button
                          type="button"
                          onClick={() => { setCustomCity(false); setFormData({ ...formData, city: '' }) }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  ) : (
                    <select
                      value={formData.city}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Other') {
                          setCustomCity(true);
                          setFormData({ ...formData, city: '' });
                        } else {
                          setFormData({ ...formData, city: val });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select City</option>
                      {POPULAR_CITIES_BY_COUNTRY[formData.country]?.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="Other">Other</option>
                    </select>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Person */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Person Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation/Role</label>
                  <input
                    type="text"
                    value={formData.contact_designation}
                    onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Booth Details */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Booth Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booth Type</label>
                  <select
                    value={formData.booth_type}
                    onChange={(e) => setFormData({ ...formData, booth_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booth Size</label>
                  <select
                    value={formData.booth_size}
                    onChange={(e) => setFormData({ ...formData, booth_size: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="3x3">3x3</option>
                    <option value="6x6">6x6</option>
                    <option value="9x9">9x9</option>
                    <option value="12x12">12x12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Booths</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.number_of_booths}
                    onChange={(e) => setFormData({ ...formData, number_of_booths: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Requirements</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.power_supply}
                        onChange={(e) => setFormData({ ...formData, power_supply: e.target.checked })}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm">Power Supply</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.lighting}
                        onChange={(e) => setFormData({ ...formData, lighting: e.target.checked })}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm">Lighting</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.internet_connection}
                        onChange={(e) => setFormData({ ...formData, internet_connection: e.target.checked })}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm">Internet Connection</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.storage_space}
                        onChange={(e) => setFormData({ ...formData, storage_space: e.target.checked })}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="text-sm">Storage Space</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Products/Services */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Products & Services
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Products/Services to Display</label>
                  <textarea
                    value={formData.products_services}
                    onChange={(e) => setFormData({ ...formData, products_services: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Credit Card">Credit/Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI/Wallets</option>
                    <option value="PayPal">PayPal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Terms & Conditions
              </h2>
              <div className="space-y-3">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    required
                    checked={formData.terms_accepted}
                    onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 mt-1"
                  />
                  <span className="text-sm">I accept the terms and conditions <span className="text-red-500">*</span></span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formData.refund_policy_accepted}
                    onChange={(e) => setFormData({ ...formData, refund_policy_accepted: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 mt-1"
                  />
                  <span className="text-sm">I accept the refund policy</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={formData.promotion_consent}
                    onChange={(e) => setFormData({ ...formData, promotion_consent: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 mt-1"
                  />
                  <span className="text-sm">I consent to using my brand in event promotions</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
