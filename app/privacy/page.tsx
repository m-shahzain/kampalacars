import type { Metadata } from 'next'
import { Layout } from '@/components/Layout'

export const metadata: Metadata = {
  title: 'Privacy Policy | Kampala Cars',
  description: 'How Kampala Cars collects, uses and protects your information.',
}

const LAST_UPDATED = 'October 18, 2026'
const CONTACT_WHATSAPP = '+256 752 328 882'
const CONTACT_WHATSAPP_URL = 'https://wa.me/256752328882'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-600">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <article className="mx-auto max-w-3xl">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

          <p className="mt-6 text-sm leading-relaxed text-gray-600">
            Kampala Cars (kampalacars.com) is an online marketplace where people in Uganda buy and sell cars.
            This policy explains what information we collect, why we collect it, and the choices you have.
          </p>

          <Section title="Information we collect">
            <p><strong className="text-gray-900">When you create an account:</strong> your name or company name, email address, phone number, address, an optional profile picture, and your password. Passwords are stored in encrypted (hashed) form by our login provider; we cannot see them.</p>
            <p><strong className="text-gray-900">When you sign in with Google:</strong> your name, email address and Google profile picture. We do not receive your Google password or access to anything else in your Google account.</p>
            <p><strong className="text-gray-900">When you list a car:</strong> the details you enter (such as make, model, year, price, mileage, chassis number and description) and the photos you upload.</p>
            <p><strong className="text-gray-900">When you use the site:</strong> which cars you like, and how many times listings are viewed. View counts are not linked to who viewed them.</p>
            <p><strong className="text-gray-900">Cookies:</strong> we use cookies to keep you signed in and, for visitors without an account, a random identifier so a liked car stays liked. We do not use advertising cookies.</p>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc space-y-1 pl-5">
              <li>To create and secure your account, including sending verification and password reset codes by email.</li>
              <li>To publish your car listings and let buyers contact you about them.</li>
              <li>To review listings before they go live and to prevent fraud and misuse.</li>
              <li>To show sellers how many people viewed and liked their listings.</li>
              <li>To respond when you contact us.</li>
            </ul>
          </Section>

          <Section title="What other people can see">
            <p>Your listings, your name or company name and your profile picture are shown publicly with the cars you list. Depending on your seller account, buyers may also see your phone number and email on your listings so they can contact you, or they may be directed to Kampala Cars instead. Your address is not shown publicly.</p>
          </Section>

          <Section title="Who we share information with">
            <p>We do not sell your personal information. We share it only with the service providers that run the site for us, and only as needed:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong className="text-gray-900">Supabase</strong>: stores our database, photos and login accounts.</li>
              <li><strong className="text-gray-900">Resend</strong>: sends our account emails, such as verification codes.</li>
              <li><strong className="text-gray-900">Google</strong>: only if you choose to sign in with Google.</li>
              <li><strong className="text-gray-900">WhatsApp (Meta)</strong>: only if you message us on WhatsApp.</li>
              <li>Our website hosting provider.</li>
            </ul>
            <p>We may also disclose information if required by law.</p>
          </Section>

          <Section title="How long we keep it">
            <p>We keep your account information for as long as your account is active. When a listing or account is deleted, it is removed from the site. Backups may keep copies for a limited time before they are deleted.</p>
          </Section>

          <Section title="Your choices and rights">
            <p>You can update your name, phone number and profile picture from your dashboard at any time. You can also ask us to see the information we hold about you, correct it, or delete your account, in line with Uganda&apos;s Data Protection and Privacy Act, 2019. Contact us using the details below.</p>
          </Section>

          <Section title="Security">
            <p>We use encrypted connections (HTTPS), encrypted password storage, and access controls to protect your information. No online service can be completely secure, so please use a strong password and keep it private.</p>
          </Section>

          <Section title="Children">
            <p>Kampala Cars is intended for people aged 18 and over. We do not knowingly collect information from children.</p>
          </Section>

          <Section title="Changes to this policy">
            <p>We may update this policy from time to time. The date at the top shows when it was last changed.</p>
          </Section>

          <Section title="Contact us">
            <p>
              For privacy questions or requests, message us on WhatsApp at{' '}
              <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-gold-700 hover:text-gold-800">
                {CONTACT_WHATSAPP}
              </a>.
            </p>
          </Section>
        </article>
      </div>
    </Layout>
  )
}
