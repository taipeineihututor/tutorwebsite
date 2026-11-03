import React from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { PageShell, Panel } from '../components/ui';

export const CONTACT_EMAIL = 'teachformosa@gmail.com';

const H2 = ({ children }) => <h2 className="text-2xl font-black text-slate-900 mt-10 mb-3">{children}</h2>;
const H3 = ({ children }) => <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">{children}</h3>;
const P = ({ children }) => <p className="text-slate-700 leading-relaxed mb-3">{children}</p>;
const UL = ({ items }) => (
  <ul className="list-disc pl-6 space-y-1.5 text-slate-700 leading-relaxed mb-3">
    {items.map((i, n) => <li key={n}>{i}</li>)}
  </ul>
);
const Mailto = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-emerald-700 underline">{CONTACT_EMAIL}</a>
);

export default function Legal() {
  return (
    <PageShell title="Terms & Privacy" subtitle="In plain English. Last updated 3 November 2026.">
      <Panel>
        {/* The short version */}
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
          <h2 className="text-lg font-black text-slate-900 mb-3">The short version</h2>
          <ul className="space-y-2.5 text-slate-800">
            {[
              'Posting is free, for teachers and for schools.',
              'Every teacher profile and job post is reviewed by us before it goes live.',
              'We never sell your information, and we do not give it to third parties for advertising or marketing.',
              "A teacher's email, phone and intro video are never shown publicly. Only verified institutions can see them, and only if the teacher agreed.",
              'Every school, kindergarten, cram school or company is verified by us before it can post jobs (up to 3 at a time) or see teacher contact details.',
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
            <li className="flex gap-2.5">
              <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Any question or problem? Email <Mailto />.</span>
            </li>
          </ul>
        </div>

        {/* TERMS */}
        <H2>Terms of use</H2>

        <H3>1. What TeachFormosa is</H3>
        <P>
          TeachFormosa is a place where teachers and schools in Taiwan can find each other. We are not a school, an
          employer or a recruitment agency. We do not hire anyone, we do not promise that anyone will find a job or a
          teacher, and we do not take part in any contract between a teacher and a school.
        </P>

        <H3>2. Free to post, and moderated</H3>
        <P>
          It costs nothing to create a teacher profile or post a job. Every submission is checked by us before it
          appears on the site. We may approve it, ask you to change it, reject it, or take it offline or delete it at
          any time. For example, if it is incomplete, misleading, a duplicate, not about teaching, or breaks these
          rules. Being approved does not mean we have verified what it says.
        </P>

        <H3>3. What we ask of you</H3>
        <UL items={[
          'Be truthful. Do not post false or misleading information, including about qualifications, pay, or visa status.',
          'Teachers: only create a profile for yourself, and only upload a photo of yourself that you are happy to show publicly.',
          'Schools: only post for a school you are allowed to recruit for. Do not charge job seekers any fee.',
          'Do not post anything illegal, discriminatory, abusive or spam, and do not use the site to scam or harass people.',
          'Do not copy other people’s details from the site or use them for anything other than genuine recruiting.',
        ]} />

        <H3>4. Visas and work permits</H3>
        <P>
          Visa, ARC and work permit details on the site are written by the teachers and schools themselves. We do not
          check them and we do not give legal or immigration advice. Schools are responsible for hiring legally and for
          the work permit process. Teachers should confirm their own situation with the relevant Taiwan authorities.
        </P>

        <H3>5. Verified institutions and contacting a teacher</H3>
        <P>
          Institutions (schools, kindergartens, cram schools, universities, companies and so on) must register and be
          verified by us before they can post a job or see any teacher’s contact details. We check the name, the Taiwan
          business tax ID and a document such as a business registration or school permit. Each institution can have up to
          3 active job posts (live or waiting for review) at a time and can close a post whenever it likes.
        </P>
        <P>
          A teacher can choose to share their email, phone number and intro video with verified institutions. If they do
          not, nobody can see them, and a school can only use “Contact this teacher”: the message comes to us first and we
          pass it on, and the teacher decides whether to reply. If they do, a verified institution can reveal one
          teacher’s details at a time. Every view is recorded (which institution, which teacher, when) and the number of
          views per day is limited.
        </P>
        <P>
          Institutions agree to use teachers’ details only to offer them genuine teaching work, not to pass them on, sell
          them, send advertising or spam. We may remove an institution’s access at any time.
        </P>

        <H3>6. No guarantees</H3>
        <P>
          The site is provided as it is. It may sometimes be unavailable or contain mistakes. To the extent the law
          allows, we are not responsible for what happens between teachers and schools, or for any loss from using the
          site. Nothing here limits any rights you have that cannot be limited by law.
        </P>

        <H3>7. Changes</H3>
        <P>We may update these terms. The date at the top shows when they were last changed.</P>

        {/* PRIVACY */}
        <H2>Privacy</H2>

        <H3>What we collect</H3>
        <UL items={[
          'Teachers: name, email, phone or LINE (optional), whether you agree to share them with verified institutions, nationality, education, certificates, experience, an introduction, a photo (optional), a link to an intro video (optional), whether you are in Taiwan, visa and stay-until date, whether you need ARC sponsorship, where you want to work, and when you are available (including any hours you list for each day).',
          'Institutions: name, type, Taiwan business tax ID, address, website (optional), the name, job title and phone of the person responsible, the login email, a proof document (for example a business registration or school permit) that only our admin can open, and a note of which teachers’ contact details they viewed. When they post a job: contact name and email, an application link (optional), a logo (optional), up to 3 school locations (address and optional Google Maps link), and the job details.',
          'Messages: if a school contacts a teacher through the site, we receive the sender’s name, school, email and message.',
          'Technical data: like most websites, our hosting provider sees basic information such as your IP address when you visit. When you submit a form we also keep your IP address for about 2 days, only to block spam and abuse.',
        ]} />

        <H3>What is public and what is private</H3>
        <UL items={[
          'Teacher profile, once approved, is public: first name and last initial, photo, nationality, education, experience, introduction, visa type and stay-until date, whether you need ARC sponsorship, where you want to work, and availability.',
          'Teacher details that are never shown publicly: full name, email, phone or LINE and the intro video link. The site admin can see them. If the teacher ticked the box to share them, verified institutions can also see the email, phone and video link (each view is recorded). The public only sees that a teacher “has an intro video”.',
          'Institution registration details and proof documents are visible only to the site admin.',
          'Job post, once approved, is public, including the school name, logo, locations, the contact person’s name and the contact email, so that teachers can apply.',
        ]} />

        <H3>How we use it</H3>
        <P>
          To run the site: reviewing submissions, showing approved ones, passing on messages, sending the site admin an
          email alert when something new arrives, and answering your questions. We do not use your information for
          advertising and we do not run advertising or tracking cookies.
        </P>

        <H3>We do not sell your information</H3>
        <P>
          We never sell your personal information, and we do not give it to third parties for their own purposes. We do
          use a small number of service providers who handle data on our behalf, only to run this site:
        </P>
        <UL items={[
          'Vercel: hosts the website.',
          'Supabase: stores the database, photos, institutions’ proof documents (private) and the logins.',
          'Resend: sends the email alerts to the site admin.',
          'Google Fonts: the site’s fonts load from Google, so Google can see your IP address when a page loads.',
          'OpenFreeMap and OpenStreetMap: the job map loads its map data from OpenFreeMap (built on OpenStreetMap), and when a school posts a job the address of each location is sent to OpenStreetMap’s free search service (Nominatim) to place it on the map.',
        ]} />
        <P>
          These providers may store data on servers outside Taiwan, for example in Japan or the United States. We may
          also disclose information if the law requires it.
        </P>

        <H3>How long we keep it, and deleting it</H3>
        <P>
          We keep your information while your profile or job post is on the site, and for a reasonable time afterwards.
          You can ask us at any time to correct or delete your profile, job post, photo or messages. Email <Mailto />{' '}
          from the address you used to sign up, and we will take care of it promptly.
        </P>

        <H3>Security</H3>
        <P>
          Private details can only be read by the site admin, and the database is set up so that the public cannot read
          them. No website is perfectly secure, so please only share what you are comfortable sharing.
        </P>

        <H3>Age</H3>
        <P>TeachFormosa is for adults (18 and over).</P>

        <H2>Contact</H2>
        <P>Questions, corrections, or anything that does not look right: <Mailto />.</P>
      </Panel>
    </PageShell>
  );
}
