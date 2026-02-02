export default function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white shadow sm:rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms and Conditions</h1>
                <div className="prose max-w-none text-gray-600">
                    <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. Agreement to Terms</h2>
                    <p className="mb-4">
                        These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Ayphen Event Planner ("we," "us" or "our"), concerning your access to and use of the Ayphen Event Planner website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. Intellectual Property Rights</h2>
                    <p className="mb-4">
                        Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3. User Representations</h2>
                    <p className="mb-4">
                        By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms and Conditions.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4. Fees and Payment</h2>
                    <p className="mb-4">
                        We accept the following forms of payment: Visa, Mastercard, American Express. You may be required to purchase or pay a fee to access some of our services. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Site.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5. Termination</h2>
                    <p className="mb-4">
                        We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6. Contact Us</h2>
                    <p className="mb-4">
                        In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at support@ayphen.com.
                    </p>
                </div>
            </div>
        </div>
    )
}
