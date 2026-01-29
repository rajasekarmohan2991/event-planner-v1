export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white shadow sm:rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                <div className="prose max-w-none text-gray-600">
                    <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. Introduction</h2>
                    <p className="mb-4">
                        Welcome to Ayphen Event Planner. We respect your privacy and are committed to protecting your personal data.
                        This privacy policy will inform you as to how we look after your personal data when you visit our website
                        and tell you about your privacy rights and how the law protects you.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. The Data We Collect</h2>
                    <p className="mb-4">
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-2">
                        <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                        <li><strong>Contact Data:</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                        <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3. How We Use Your Data</h2>
                    <p className="mb-4">
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-2">
                        <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                        <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                        <li>Where we need to comply with a legal or regulatory obligation.</li>
                    </ul>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4. Data Security</h2>
                    <p className="mb-4">
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5. Contact Us</h2>
                    <p className="mb-4">
                        If you have any questions about this privacy policy or our privacy practices, please contact us at support@ayphen.com.
                    </p>
                </div>
            </div>
        </div>
    )
}
