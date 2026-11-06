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
    <PageShell title="Terms & Privacy" subtitle="In plain English. Last updated 6 November 2026.">
      <Panel>
        {/* The short version */}
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
          <h2 className="text-lg font-black text-slate-900 mb-3">The short version</h2>
          <ul className="space-y-2.5 text-slate-800">
            {[
              'Posting is free, for teachers and for schools.',
              'We verify every school and institution before it can post. Teacher profiles and job posts from verified institutions go live straight away, and we may remove anything that breaks the rules.',
              'We never sell your information, and we do not give it to third parties for advertising or marketing.',
              "A teacher's email, phone and intro video are never shown publicly. Only verified institutions can see them, so schools contact teachers directly.",
              'Teacher profiles that have not been used (signed in) for 30 days are hidden. We email a reminder 5 days before.',
              'Schools can only use teachers’ details to offer them real teaching work, never to pass on, sell or spam.',
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
          TeachFormosa is a free website where teachers and schools in Taiwan can find each other. We are not a school,
          an employer or a recruitment agency. We do not hire anyone, we do not promise that anyone will find a job or a
          teacher, and we do not take part in any contract between a teacher and a school. By using the site you agree
          to these terms. If you do not agree, please do not use it.
        </P>

        <H3>2. Free to post, and verified schools</H3>
        <P>
          It costs nothing to create a teacher profile or post a job. We verify institutions (see section 5). Teacher
          profiles and the job posts of verified institutions are published straight away, without a review. We may
          take any profile or post offline, or delete it, at any time, for example if it is misleading, a duplicate, not
          about teaching, or breaks these rules. We do not check what teachers and schools write about themselves.
        </P>

        <H3>3. What we ask of you</H3>
        <UL items={[
          'Be truthful. Do not post false or misleading information, including about qualifications, pay, or visa status.',
          'Teachers: only create a profile for yourself, and only upload a photo of yourself that you are happy to show publicly.',
          'Schools: only post for the institution you are registered for, and only for your own vacancies. Do not charge job seekers any fee.',
          'No posting on behalf of someone else. Third-party posts are not allowed, and neither are posts by recruitment agencies, employment agents, staffing or HR-service companies, or consultants.',
          'Do not post anything illegal, discriminatory, offensive, abusive or spam, and do not use the site to scam or harass people.',
          'Do not use the site to advertise products or services, or to run a competing job board, directory or listing service.',
          'Do not copy, scrape or collect other people’s details or the content of the site, build lists from it, or use it for anything other than genuine recruiting or looking for work.',
          'Do not try to break, overload or get around the security of the site, or to use someone else’s login.',
          'Keep your login private. You are responsible for what is done with your account.',
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
          verified by us before they can post a job or see any teacher’s contact details. We check the name and either the Taiwan
          business tax ID (preferred, optional) or at least one other credential: a document such as a business registration or school permit, an
          email address on the institution’s own domain, or another verifiable credential. A license is not required. Each institution can have up to
          3 active job posts at a time and can close a post whenever it likes.
        </P>
        <P>
          A teacher’s email, phone number and intro video are visible to verified institutions only, so that schools can
          contact teachers directly. We do not forward messages. Teachers agree to this when they create a profile. A
          verified institution reveals one teacher’s details at a time. Every view is recorded (which institution, which
          teacher, when) and the number of views per day is limited. The details of a job post (including the contact
          person and email) are visible to teachers so they can apply.
        </P>
        <P>
          Institutions agree to use teachers’ details only to contact them about genuine teaching work at that
          institution. They must not pass the details to anyone else (including other schools or agencies), sell them,
          make lists or databases from them, or use them for advertising, events, bulk or unsolicited messages, or any
          other purpose. Teachers likewise agree to use the contact details in job posts only to apply for that job.
          Misuse may lead to removal and, where the law allows, legal action.
        </P>

        <H3>6. Dealings between teachers and schools</H3>
        <P>
          Everything that happens after a teacher and a school get in touch is between them: interviews, contracts, pay,
          work permits and any dispute. We are not a party to it and cannot resolve it. Both sides are responsible for
          checking each other out, and for following Taiwan’s labour, immigration and other laws. Please never pay money
          to someone you have met only through a job post, and tell us if anyone asks you to.
        </P>

        <H3>7. Content you post</H3>
        <P>
          You own what you post. By posting it you give TeachFormosa a free, non-exclusive permission to store, display
          and share it on the site (and to make technical copies, for example thumbnails and backups) for as long as it is
          on the site, so that the service works. Only post things you have the right to post, such as your own photo, or
          a logo your institution allows you to use. The site design, text and code belong to TeachFormosa or its
          licensors, and you may not copy them without our permission.
        </P>

        <H3>8. Suspending or ending access</H3>
        <P>
          We may remove content, or suspend or end a login or an institution’s access, at any time and without notice, if
          we believe these rules have been broken or that someone is being harmed. You can stop using the site, and delete
          your profile or close your posts, whenever you like. A school that closes down or stops recruiting should close
          its posts.
        </P>

        <H3>9. No guarantees, and limits on our responsibility</H3>
        <P>
          The site is provided “as is” and “as available”. It may sometimes be unavailable, contain mistakes, or link to
          other websites we do not control. We do not guarantee the accuracy, completeness or timing of anything on it,
          that every teacher or school is genuine, or that the site is free of viruses or errors. Information on the
          site is not advice. Please keep your own copy of anything important. To the extent the law allows, we are not
          responsible for what happens between teachers and schools, for what other users do or write, or for any loss
          or damage from using the site. Nothing here limits any rights you have that cannot be limited by law.
        </P>

        <H3>10. If you break the rules</H3>
        <P>
          You are responsible for what you post and do on the site. If you break these terms and that causes us or other
          people loss or a claim, you agree to cover that loss as far as the law allows.
        </P>

        <H3>11. Changes</H3>
        <P>
          We may update these terms at any time. The new version applies once it is posted, and the date at the top shows
          when they were last changed. If you keep using the site after a change, you accept the new terms.
        </P>

        <H3>12. Law and courts</H3>
        <P>
          These terms are governed by the laws of Taiwan (Republic of China). Any dispute with TeachFormosa about the site
          or these terms will be brought in the competent courts of Taiwan, with the Taipei District Court as the court of
          first instance. If any part of these terms is found invalid, the rest still applies. If we do not enforce a rule
          straight away, that does not mean we give it up.
        </P>

        {/* PRIVACY */}
        <H2>Privacy</H2>

        <H3>What we collect</H3>
        <UL items={[
          'Teachers: name, email, phone or LINE (optional), nationality, education, certificates, experience, an introduction, a photo (optional), a link to an intro video (optional), whether you are in Taiwan, visa and stay-until date, whether you need ARC sponsorship, where you want to work, and when you are available (including any hours you list for each day).',
          'Institutions: name, type, Taiwan business tax ID (optional), address, website (optional), the name, job title and phone of the person responsible, the login email, at least one way to verify the institution (a document such as a business registration or school permit, an email address on the institution’s own domain, or another credential or link), which only our admin can see, and a note of which teachers’ contact details they viewed. When they post a job: contact name and email, an application link (optional), a logo (optional), up to 3 school locations (address and optional Google Maps link), and the job details.',
          'Messages: schools contact teachers directly by email or phone. We do not read or forward them.',
          'Technical data: like most websites, our hosting provider sees basic information such as your IP address when you visit. When you submit a form we also keep your IP address for about 2 days, only to block spam and abuse.',
        ]} />

        <H3>What is public and what is private</H3>
        <UL items={[
          'Teacher profile, once approved, is public: first name and last initial, photo, nationality, education, experience, introduction, visa type and stay-until date, whether you need ARC sponsorship, where you want to work, and availability.',
          'Teacher details that are never shown publicly: full name, email, phone or LINE and the intro video link. The site admin and verified institutions can see them (each view by an institution is recorded). The public only sees that a teacher “has an intro video”.',
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
          'Resend: sends the email alerts to the site admin and the reminder emails to teachers.',
          'Google Fonts: the site’s fonts load from Google, so Google can see your IP address when a page loads.',
          'OpenFreeMap and OpenStreetMap: the job map loads its map data from OpenFreeMap (built on OpenStreetMap), and when a school posts a job the address of each location is sent to OpenStreetMap’s free search service (Nominatim) to place it on the map.',
        ]} />
        <P>
          These providers may store data on servers outside Taiwan, for example in Japan or the United States. We may
          also disclose information if the law requires it.
        </P>

        <H3>Teacher logins</H3>
        <P>
          Teachers create a login (email and password) to publish their profile, and can edit it, hide it or
          delete it. A login is needed to create a profile. Changes are published straight away. To keep the site up to date,
          a profile whose owner has not signed in for 30 days is hidden from schools until the teacher signs in again, and
          we send an email reminder 5 days before this happens.
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
