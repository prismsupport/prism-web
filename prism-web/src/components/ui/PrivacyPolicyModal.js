'use client'

import Modal from '@/components/ui/Modal'

const OPERATOR_NAME = 'Official PRISM Support'
const CONTACT_EMAIL = 'prismsupport01@gmail.com'
const LAST_UPDATED = 'October 28, 2026'

const SECTIONS = [
  {
    title: '1. Introduction',
    body: [
      `This Privacy Policy explains how PRISM (Power Reporting and Integrated System Management), operated by ${OPERATOR_NAME} ("PRISM", "we", "us"), collects, uses, stores, and protects personal information. It applies to cooperative supervisors, linemen, consumers, and the platform administrator.`,
      'We process personal information in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules and Regulations, and National Privacy Commission (NPC) issuances.',
    ],
  },
  {
    title: '2. Roles: Who Controls the Data',
    body: [
      'Each electric cooperative that registers on PRISM is the personal information controller for its consumers\' and employees\' data. It decides why and how that data is used.',
      'PRISM acts as a processor on the cooperative\'s behalf. We process the data only to provide the platform and do not use it for our own unrelated purposes.',
    ],
  },
  {
    title: '3. Information We Collect',
    body: [
      'Account information: full name, email address, contact number, password (stored only in hashed form), profile photo (optional), and, for consumers, address details (zone, barangay, municipality) and the assigned feeder.',
      'Cooperative registration information: cooperative name, office address, contact number, and official email.',
      'Outage reports: GPS coordinates of the outage, address and nearest landmark, description, photos, whether nearby homes are affected, and the electric account number.',
      'Field and repair information (linemen): job order status and timestamps, completion checklist, repair photos, voice recordings, written remarks, and the lineman\'s duty schedule, assigned area office, and location.',
      'Lineman location: while a lineman is on duty and the app is open, the app reports the device location about every 30 seconds or after moving about 50 meters. Tracking stops when the lineman is off shift, and no location is reported while the app is closed.',
      'Billing information: account number, account name, and account type submitted in a linkage request. When a supervisor reviews a request, we look up the account holder\'s name and the latest bill\'s status in the cooperative\'s billing system. Retrieved billing data is not copied into our database.',
      'Service interactions: FAQ chatbot questions, supervisor replies, ratings and comments, reopen requests, and notifications.',
      'Device and technical information: push notification tokens, login session tokens, and basic technical logs needed to run and secure the service.',
    ],
  },
  {
    title: '4. How We Use Information',
    body: [
      'To create and manage accounts and verify identity (including email verification codes).',
      'To receive, locate, track, and resolve outage reports, and to give consumers live ticket status and push notifications.',
      'To help supervisors group duplicate reports, dispatch linemen, review completed repairs, and publish targeted power advisories.',
      'To guide linemen to outage sites using maps and routing.',
      'To verify billing account linkage requests and show read-only billing information to approved accounts.',
      'To produce service analytics for the cooperative, such as response time, repair time, and lineman performance.',
      'To secure the platform, prevent misuse, and meet legal obligations.',
      'We do not sell personal information and do not use it for advertising.',
    ],
  },
  {
    title: '5. Legal Basis for Processing',
    body: [
      'Depending on the activity, processing relies on the user\'s consent (for example, when registering and agreeing to our terms), the need to provide the service the user requested (such as filing an outage report), compliance with legal obligations, and the legitimate interests of the cooperative and PRISM in delivering and securing a reliable outage management service.',
      'The cooperative is responsible for making sure it has a proper basis to collect and use its consumers\' and employees\' data.',
    ],
  },
  {
    title: '6. Who Can See Your Information',
    body: [
      'Access is limited by role. Consumers see only their own reports and billing information. Linemen see only the job orders assigned to them, including the details needed to do the job (such as the consumer\'s name, contact number, location, and photos). Supervisors see only the records of their own cooperative, and only the modules the cooperative\'s Owner has assigned to them. The platform administrator manages cooperative registrations.',
      'Information is not shared with other cooperatives.',
    ],
  },
  {
    title: '7. Service Providers and Third Parties',
    body: [
      'To run the platform we use third-party services that may process data on our behalf, including: cloud hosting, database, authentication, and file storage providers; a push notification service; and map, address lookup (geocoding), and routing services, which receive the coordinates needed to display maps, convert locations to addresses, and calculate routes.',
      'If a cooperative connects its billing system, the platform sends the account number to that cooperative\'s billing API to verify a linkage request.',
      'Some of these providers may store or process data outside the Philippines. We use providers that apply appropriate security safeguards, and we limit what is shared to what is needed for the service.',
      'We may disclose information when required by law, a court order, or a lawful request from a government authority.',
    ],
  },
  {
    title: '8. Security',
    body: [
      'We use reasonable organizational, physical, and technical measures, including: encrypted connections (HTTPS/TLS); hashed passwords; role-based access controls and row-level database security that separate data by role and cooperative; private storage for report photos, repair proofs, voice recordings, and advisory photos, delivered only through links that expire; and encrypted storage of cooperative billing API keys.',
      'Profile photos are stored separately and can be opened by anyone who has the photo\'s link. Do not use a profile photo you do not want to be viewable.',
      'No system is completely secure. Users should keep their passwords confidential and report suspected unauthorized access to us immediately.',
    ],
  },
  {
    title: '9. Data Retention',
    body: [
      'We keep personal information for as long as an account is active and as needed to provide the service, keep job order and ticket history, and meet legal obligations. Earlier job order attempts are intentionally preserved as part of a ticket\'s history.',
      'When an account or cooperative is deactivated, data is handled as agreed with the cooperative and may be exported or deleted on request, subject to any legal retention requirements. Information stored temporarily on a device (for example, an offline report waiting to be sent) is cleared when sent or when the user logs out.',
    ],
  },
  {
    title: '10. Your Rights',
    body: [
      'Under the Data Privacy Act, you have the right to: be informed about how your data is processed; access your personal data; object to processing; correct inaccurate data; request erasure or blocking of data that is incomplete, outdated, false, unlawfully obtained, or no longer needed; data portability where applicable; claim compensation for damages from inaccurate, unlawful, or unauthorized processing; and file a complaint with the National Privacy Commission (www.privacy.gov.ph).',
      `Consumers can update many details (contact number, address, profile photo) directly in the app. For other requests, contact your electric cooperative or reach us at ${CONTACT_EMAIL}. We may need to confirm your identity first.`,
    ],
  },
  {
    title: '11. Personal Data Breaches',
    body: [
      'If a breach affecting personal information occurs, we will assess it, take steps to contain it, and notify the affected cooperative without undue delay so that required notifications to the NPC and affected individuals can be made within the periods set by law.',
    ],
  },
  {
    title: '12. Children',
    body: [
      'PRISM is intended for electricity subscribers, cooperative staff, and field personnel who are adults. We do not knowingly collect information from minors. If you believe a minor has registered, contact us so we can review and remove the account.',
    ],
  },
  {
    title: '13. Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. Material changes will be communicated to cooperatives (for example, by email or an in-app notice). The "Last updated" date shows the latest version.',
    ],
  },
  {
    title: '14. Contact Us',
    body: [
      `For privacy questions, requests, or concerns, contact ${OPERATOR_NAME} at ${CONTACT_EMAIL}.`,
    ],
  },
]

export default function PrivacyPolicyModal({ onClose }) {
  return (
    <Modal title="Privacy Policy" onClose={onClose} size="xl">
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

      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}