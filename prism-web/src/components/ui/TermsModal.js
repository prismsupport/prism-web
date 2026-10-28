'use client'

import Modal from '@/components/ui/Modal'

const OPERATOR_NAME = 'Official PRISM Support'
const CONTACT_EMAIL = 'prismsupport01@gmail.com'
const LAST_UPDATED = 'October 28, 2026'

const SECTIONS = [
  {
    title: '1. About These Terms',
    body: [
      `These Terms and Conditions ("Terms") govern the registration and use of PRISM (Power Reporting and Integrated System Management), an outage reporting and management platform operated by ${OPERATOR_NAME} ("PRISM", "we", "us").`,
      'By ticking the agreement box and submitting a registration, you accept these Terms on behalf of yourself and the electric cooperative you are registering. If you do not agree, do not register.',
    ],
  },
  {
    title: '2. Definitions',
    body: [
      '"Cooperative" means the electric cooperative registered on the platform.',
      '"Owner" means the supervisor who registers the Cooperative and holds full administrative access.',
      '"Users" means the Cooperative\'s supervisors, linemen, and consumers who use the platform.',
      '"Platform" means the PRISM web dashboards, mobile application, and related services.',
      '"Cooperative Data" means all information entered into or generated in the Platform by or about the Cooperative and its Users, including consumer records, reports, tickets, advisories, and ratings.',
    ],
  },
  {
    title: '3. Authority and Accuracy of Information',
    body: [
      'You confirm that you are authorized to register and bind the Cooperative to these Terms.',
      'All registration details (Cooperative name, address, contact details, official email) must be true, accurate, and kept up to date. Providing false or misleading information is grounds for rejection or deactivation.',
    ],
  },
  {
    title: '4. Registration Review and Approval',
    body: [
      'A new registration is created with a Pending Approval status. You cannot access the dashboard until the PRISM Superadmin approves it.',
      'We may approve or reject a registration at our discretion. If a registration is rejected, the reason will be shown when you try to log in.',
    ],
  },
  {
    title: '5. Data Privacy and Protection',
    body: [
      'The Platform processes personal information, including consumer names, contact numbers, addresses, GPS locations, photos, voice recordings, and billing account details. The Cooperative and PRISM agree to handle this data in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules and Regulations, and National Privacy Commission issuances.',
      'The Cooperative acts as the personal information controller for its consumers\' and employees\' data. It is responsible for having a lawful basis for collecting that data, for informing consumers how it is used, and for responding to consumer requests to access, correct, or delete their data. PRISM processes this data only to provide the Platform.',
      'Cooperative Data is used only for outage reporting, dispatch, advisories, billing inquiry, and related consumer service. It will not be sold or used for advertising.',
      'Access is limited by role: consumers see only their own records, linemen see only their assigned job orders, and supervisors see only their own Cooperative\'s records.',
      'If a personal data breach affecting Cooperative Data occurs, we will notify the Cooperative without undue delay so that required notifications to the National Privacy Commission and affected persons can be made as the law requires.',
      'Our handling of personal information is further described in the PRISM Privacy Policy, which forms part of these Terms.',
    ],
  },
  {
    title: '6. Accounts and Security',
    body: [
      'As the Owner, you are responsible for every account you create (supervisors and linemen), the module access you assign, and all activity under those accounts.',
      'Keep login credentials confidential and use strong passwords. Do not share accounts. Deactivate accounts of people who leave the Cooperative.',
      'Notify us promptly at the contact address below if you suspect unauthorized access.',
    ],
  },
  {
    title: '7. Billing Integration',
    body: [
      'Connecting a billing system is optional. If you connect one, you authorize PRISM to make read-only lookups to the billing API you provide, solely to help verify consumer billing account linkage requests.',
      'PRISM does not process payments, does not change billing records, and does not copy retrieved billing data into its database. The API key you provide is stored in encrypted form.',
      'You are responsible for the security and accuracy of your billing API and for having the right to share the information it returns.',
    ],
  },
  {
    title: '8. Acceptable Use',
    body: [
      'Use the Platform only for legitimate outage management and consumer service.',
      'You must not: attempt to access data that is not yours; interfere with or disrupt the Platform; upload unlawful, harmful, or malicious content; reverse engineer the Platform; or use it to harass or mislead consumers.',
      'Advisories and messages sent through the Platform must be accurate and must not be used for unrelated announcements.',
    ],
  },
  {
    title: '9. Service Limitations and Disclaimer',
    body: [
      'The Platform requires an internet connection. Delays in notifications, reports, or maps caused by poor signal, device settings, or outages are outside our control.',
      'GPS locations, distances, and estimated arrival times are approximations and depend on device hardware and signal conditions.',
      'The duplicate report suggestions and lineman dispatch recommendations are rule-based decision-support tools. They are not automatic decisions. The Cooperative\'s supervisors remain fully responsible for merging reports, dispatching linemen, quality assurance, and all operational decisions.',
      'The FAQ chatbot answers only common questions and is not a substitute for human assistance.',
      'The Platform is provided "as is" and "as available", without a guarantee of uninterrupted or error-free operation. We may perform maintenance, update features, or change the Platform from time to time.',
    ],
  },
  {
    title: '10. Limitation of Liability',
    body: [
      'To the fullest extent permitted by law, PRISM and its operators are not liable for indirect or consequential losses, including delayed power restoration, wrong or duplicate dispatches, missed or delayed notifications, loss of data due to events outside our control, or decisions made using Platform information.',
      'Nothing in these Terms limits liability that cannot be limited under Philippine law.',
    ],
  },
  {
    title: '11. Data Ownership, Retention, and Deletion',
    body: [
      'The Cooperative retains ownership of its Cooperative Data. PRISM retains ownership of the Platform, its software, design, and branding.',
      'Cooperative Data is kept while the Cooperative account is active and for as long as needed to provide the service and meet legal obligations. When a Cooperative is deactivated or ends its use, you may request export or deletion of its data by contacting us, and we will act on the request within a reasonable period, subject to any legal retention requirements.',
    ],
  },
  {
    title: '12. Suspension and Termination',
    body: [
      'The Superadmin may suspend or deactivate a Cooperative account if these Terms are violated, if information is found to be false, for security reasons, or when the Cooperative\'s agreement with PRISM ends.',
      'When a Cooperative is deactivated, its supervisors, linemen, and consumers can no longer log in. The Cooperative may be reactivated at the Superadmin\'s discretion.',
      'You may stop using the Platform at any time by contacting us to request deactivation.',
    ],
  },
  {
    title: '13. Changes to These Terms',
    body: [
      'We may update these Terms from time to time. Material changes will be communicated to the Owner (for example by email or an in-app notice). Continued use of the Platform after changes take effect means you accept the updated Terms.',
    ],
  },
  {
    title: '14. Governing Law',
    body: [
      'These Terms are governed by the laws of the Republic of the Philippines. Disputes will first be addressed in good faith between the parties and, if unresolved, brought before the proper courts of the Philippines.',
    ],
  },
  {
    title: '15. Contact',
    body: [
      `For questions about these Terms, data privacy requests, or to report a security concern, contact ${OPERATOR_NAME} at ${CONTACT_EMAIL}.`,
    ],
  },
]

export default function TermsModal({ onClose, onAccept }) {
  return (
    <Modal title="Terms and Conditions" onClose={onClose} size="xl">
      <p className="text-xs text-gray-400 mb-3 -mt-2">Last updated: {LAST_UPDATED}</p>

      <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-5 text-sm text-gray-700 leading-relaxed">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h3 className="font-semibold text-gray-900 mb-1.5">{section.title}</h3>
            <div className="space-y-2">
              {section.body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50"
        >
          Close
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800"
        >
          I Agree
        </button>
      </div>
    </Modal>
  )
}