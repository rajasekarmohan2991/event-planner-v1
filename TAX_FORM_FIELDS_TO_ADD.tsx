// Add these form fields to the Custom Tax Form section
// Insert after the "Description" field and before the "Set as default" checkbox

{/* Country and Currency Selection */ }
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
        </label>
        <select
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={formData.countryCode}
            onChange={(e) => {
                const country = getCountryByCode(e.target.value);
                setFormData({
                    ...formData,
                    countryCode: e.target.value,
                    currencyCode: country?.currency || 'USD'
                });
            }}
        >
            <option value="">Select Country (Optional)</option>
            {Object.values(COUNTRY_CURRENCY_MAP).map((country) => (
                <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                </option>
            ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Select country for auto-fill</p>
    </div>
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
        </label>
        <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700">
            {formData.currencyCode} ({getCountryByCode(formData.countryCode)?.currencySymbol || '$'})
        </div>
        <p className="text-xs text-gray-500 mt-1">Auto-filled from country</p>
    </div>
</div>

{/* Effective Dates */ }
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Effective From *
        </label>
        <input
            required
            type="date"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={formData.effectiveFrom}
            onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
        />
        <p className="text-xs text-gray-500 mt-1">When this tax rate becomes active</p>
    </div>
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            Effective To (Optional)
        </label>
        <input
            type="date"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={formData.effectiveTo}
            onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
            min={formData.effectiveFrom}
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
    </div>
</div>
