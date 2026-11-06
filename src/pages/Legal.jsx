import React, { useState } from 'react';
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

function LegalEn({ lang, setLang }) {
  return (
    <PageShell title="Terms & Privacy" subtitle="In plain English. Last updated 6 November 2026.">
      <Panel>
        <LangToggle lang={lang} setLang={setLang} />
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

function LangToggle({ lang, setLang }) {
  const b = (code, label) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      className={`px-3 py-1.5 text-sm font-bold rounded-lg border ${lang === code ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300'}`}
    >
      {label}
    </button>
  );
  return <div className="flex gap-2 mb-5">{b('en', 'English')}{b('zh', '繁體中文')}</div>;
}

function LegalZh({ lang, setLang }) {
  return (
    <PageShell title="使用條款與隱私權" subtitle="以淺白文字說明。最後更新：2026 年 11 月 6 日。（如中英文版本有差異，以英文版為準。）">
      <Panel>
        <LangToggle lang={lang} setLang={setLang} />
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
          <h2 className="text-lg font-black text-slate-900 mb-3">重點摘要</h2>
          <ul className="space-y-2.5 text-slate-800">
            {[
              '老師與學校刊登皆免費。',
              '每一所學校與機構須先經我們驗證才能刊登。老師檔案與已驗證機構的職缺會立即上線，違反規定的內容我們可能移除。',
              '我們絕不出售您的資料，也不會提供給第三方作廣告或行銷。',
              '老師的電子郵件、電話與自我介紹影片不會公開，只有已驗證的機構看得到，由學校直接聯絡老師。',
              '30 天內未登入的老師檔案會被隱藏，我們會在 5 天前寄信提醒。',
              '學校只能用老師的聯絡資料提供真實的教學工作，不得轉給他人、販售或發送垃圾訊息。',
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
            <li className="flex gap-2.5">
              <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>有任何問題？請來信 <Mailto />。</span>
            </li>
          </ul>
        </div>

        <H2>使用條款</H2>

        <H3>1. TeachFormosa 是什麼</H3>
        <P>TeachFormosa 是一個免費網站，讓台灣的老師與學校互相找到對方。我們不是學校、雇主或人力仲介，不會僱用任何人，不保證任何人能找到工作或老師，也不參與老師與學校之間的任何契約。使用本網站即表示您同意這些條款；若不同意，請勿使用。</P>

        <H3>2. 免費刊登與已驗證學校</H3>
        <P>建立老師檔案或刊登職缺不需任何費用。我們會驗證機構（見第 5 條）。老師檔案與已驗證機構的職缺會立即公開，不經事前審核。若內容不實、重複、與教學無關或違反規定，我們得隨時將其下架或刪除。我們不會查核老師與學校自行填寫的內容。</P>

        <H3>3. 我們對您的要求</H3>
        <UL items={[
          '誠實。不得張貼不實或誤導的資訊，包括學經歷、薪資或簽證身分。',
          '老師：只能為自己建立檔案，且只能上傳您願意公開的本人照片。',
          '學校：只能為所登記的機構、自己的職缺刊登，且不得向求職者收取任何費用。',
          '不得代他人刊登。禁止第三方代刊，也禁止人力仲介、職業介紹所、派遣或人資服務公司及顧問刊登。',
          '不得張貼違法、歧視、冒犯、辱罵或垃圾內容，也不得利用本網站詐騙或騷擾他人。',
          '不得利用本網站宣傳商品或服務，或經營競爭性的求才網站、名錄或刊登服務。',
          '不得複製、爬取或蒐集他人資料或網站內容、據以建立名單，或用於正當徵才或求職以外的用途。',
          '不得破壞、癱瘓或繞過本網站的安全機制，也不得使用他人帳號。',
          '請妥善保管您的登入資料。您須對帳號的所有行為負責。',
        ]} />

        <H3>4. 簽證與工作許可</H3>
        <P>網站上的簽證、居留證（ARC）與工作許可資訊由老師與學校自行填寫，我們不會查核，也不提供法律或移民建議。學校須負責合法聘僱及辦理工作許可；老師請向台灣相關主管機關確認自身狀況。</P>

        <H3>5. 已驗證機構與聯絡老師</H3>
        <P>
          機構（學校、幼兒園、補習班、大學、公司等）須先註冊並經我們驗證，才能刊登職缺或查看老師的聯絡資料。我們會核對名稱，以及台灣統一編號（建議提供，非必填）或至少一項其他證明：例如商業登記或學校立案證明等文件、機構自有網域的電子郵件，或其他可查證的資料。不要求教師證照。每個機構同時最多可有 3 則有效職缺，並可隨時關閉職缺。
        </P>
        <P>
          老師的電子郵件、電話與自我介紹影片只有已驗證機構看得到，讓學校可直接聯絡老師，我們不會轉寄訊息。老師建立檔案即表示同意。已驗證機構一次只能顯示一位老師的資料；每次查看都會被記錄（哪個機構、哪位老師、何時），且每日查看次數有上限。職缺資訊（包含聯絡人與電子郵件）供老師查看以便應徵。
        </P>
        <P>
          機構同意只為該機構真實的教學工作聯絡老師，不得將資料轉給任何人（包括其他學校或仲介）、販售、建立名單或資料庫，或用於廣告、活動、大量或未經請求的訊息，及任何其他目的。老師亦同意僅將職缺中的聯絡資料用於應徵該職缺。濫用者可能被移除，法律允許時並可能被追究。
        </P>

        <H3>6. 老師與學校之間的往來</H3>
        <P>老師與學校取得聯繫後的一切，包括面試、契約、薪資、工作許可及任何爭議，都屬雙方之間的事，我們不是當事人，也無法處理爭議。雙方須自行查證對方，並遵守台灣勞動、移民及其他法令。請勿付錢給只在職缺貼文中認識的人，若有人向您要錢，請告知我們。</P>

        <H3>7. 您張貼的內容</H3>
        <P>您保有所張貼內容的權利。張貼即表示您授權 TeachFormosa 在內容留在網站期間，免費、非專屬地儲存、顯示並在網站上分享（包含為技術目的製作副本，如縮圖與備份），以讓服務運作。請只張貼您有權張貼的內容，例如本人照片，或機構同意您使用的標誌。網站的設計、文字與程式碼屬於 TeachFormosa 或其授權人，未經許可不得複製。</P>

        <H3>8. 暫停或終止使用</H3>
        <P>若我們認為規定遭違反或有人受到傷害，得隨時不經通知移除內容，或暫停、終止帳號或機構的使用權。您可隨時停止使用本網站，並刪除檔案或關閉職缺。歇業或停止徵才的學校應關閉其職缺。</P>

        <H3>9. 不作保證與責任限制</H3>
        <P>本網站按「現狀」及「可提供時」提供。可能偶爾無法使用、有錯誤，或連結到非我們控制的網站。我們不保證網站內容之正確、完整或即時，也不保證每位老師或學校皆為真實，或網站無病毒、無錯誤。網站資訊不構成建議，重要資料請自行備份。在法律允許範圍內，我們不對老師與學校之間發生的事、其他使用者的行為或內容，或因使用本網站所生的任何損失負責。本條款不限制依法不得限制的權利。</P>

        <H3>10. 若您違反規定</H3>
        <P>您須對自己在網站上的內容與行為負責。若您違反本條款而造成我們或他人損失或遭求償，您同意在法律允許範圍內負賠償責任。</P>

        <H3>11. 條款修改</H3>
        <P>我們可隨時修改本條款，新版本於公布後生效，頁首日期為最後修改日。修改後繼續使用即視為接受新條款。</P>

        <H3>12. 準據法與管轄法院</H3>
        <P>本條款以中華民國（台灣）法律為準據法。因本網站或本條款與 TeachFormosa 發生的爭議，以台灣有管轄權的法院為管轄法院，並以臺灣臺北地方法院為第一審管轄法院。若本條款任一部分被認定無效，其餘部分仍然有效；我們未立即執行某項規定，不代表放棄該規定。</P>

        <H2>隱私權</H2>

        <H3>我們蒐集的資料</H3>
        <UL items={[
          '老師：姓名、電子郵件、電話或 LINE（選填）、國籍、學歷、證書、經驗、自我介紹、照片（選填）、自我介紹影片連結（選填）、是否在台灣、簽證與停留期限、是否需要 ARC 擔保、希望工作的地點，以及可上課時間。',
          '機構：名稱、類型、台灣統一編號（選填）、地址、網站（選填）、負責人的姓名、職稱與電話、登入用電子郵件、至少一種驗證機構的方式（如商業登記或立案證明等文件、機構自有網域的電子郵件，或其他證明或連結，僅網站管理員可見），以及所查看的老師聯絡資料記錄。刊登職缺時：聯絡人姓名與電子郵件、應徵連結（選填）、標誌（選填）、最多 3 個校區地點（地址與選填的 Google 地圖連結），以及職缺內容。',
          '訊息：學校直接以電子郵件或電話聯絡老師，我們不會閱讀或轉寄。',
          '技術資料：與多數網站一樣，我們的主機服務商會看到您造訪時的 IP 位址等基本資訊。您送出表單時，我們也會保留您的 IP 位址約 2 天，僅用於阻擋垃圾訊息與濫用。',
        ]} />

        <H3>哪些公開、哪些不公開</H3>
        <UL items={[
          '老師檔案是公開的：名字與姓氏縮寫、照片、國籍、學歷、經驗、自我介紹、簽證類型與停留期限、是否需要 ARC 擔保、希望工作地點與可上課時間。',
          '老師絕不公開的資料：全名、電子郵件、電話或 LINE 與影片連結。網站管理員與已驗證機構可以看到（機構的每次查看都會被記錄）。大眾只會看到「有自我介紹影片」。',
          '機構的註冊資料與證明文件僅網站管理員可見。',
          '職缺是公開的，包括學校名稱、標誌、地點、聯絡人姓名與電子郵件，以便老師應徵。',
        ]} />

        <H3>我們如何使用資料</H3>
        <P>用於營運網站：檢視內容、顯示已公開的內容、寄信給網站管理員通知新內容，以及回覆您的問題。我們不將資料用於廣告，也不使用廣告或追蹤 cookie。</P>

        <H3>我們不出售您的資料</H3>
        <P>我們絕不出售個人資料，也不會為第三方自身目的提供資料。我們僅使用少數代為處理資料的服務供應商來營運本網站：</P>
        <UL items={[
          'Vercel：網站主機。',
          'Supabase：儲存資料庫、照片、機構證明文件（不公開）與登入資料。',
          'Resend：寄送通知網站管理員的信件，以及提醒老師的信件。',
          'Google Fonts：網站字型由 Google 載入，頁面載入時 Google 可看到您的 IP 位址。',
          'OpenFreeMap 與 OpenStreetMap：職缺地圖從 OpenFreeMap（以 OpenStreetMap 為基礎）載入，學校刊登職缺時，各地點的地址會送到 OpenStreetMap 的免費搜尋服務（Nominatim）以標示在地圖上。',
        ]} />
        <P>這些供應商可能將資料儲存在台灣以外的伺服器，例如日本或美國。法律要求時，我們也可能揭露資料。</P>

        <H3>老師登入</H3>
        <P>老師以電子郵件與密碼建立登入帳號來發布檔案，並可編輯、隱藏或刪除。建立檔案需先登入，修改後立即公開。為保持資料更新，超過 30 天未登入的檔案會對學校隱藏，直到老師再次登入；我們會在隱藏前 5 天寄信提醒。</P>

        <H3>保存期間與刪除</H3>
        <P>檔案或職缺在網站上期間，以及之後一段合理時間內，我們會保存您的資料。您可隨時要求更正或刪除檔案、職缺、照片或訊息，請用註冊時的電子郵件寄信至 <Mailto />，我們會儘速處理。</P>

        <H3>安全</H3>
        <P>私人資料只有網站管理員可以讀取，資料庫也設定為大眾無法讀取。沒有任何網站絕對安全，請只分享您願意分享的內容。</P>

        <H3>年齡</H3>
        <P>TeachFormosa 僅供成年人（18 歲以上）使用。</P>

        <H2>聯絡我們</H2>
        <P>問題、更正，或任何看起來不對的地方：<Mailto />。</P>
      </Panel>
    </PageShell>
  );
}

export default function Legal() {
  const [lang, setLang] = useState(() => {
    try { return /^zh/i.test(navigator.language || '') ? 'zh' : 'en'; } catch { return 'en'; }
  });
  return lang === 'zh' ? <LegalZh lang={lang} setLang={setLang} /> : <LegalEn lang={lang} setLang={setLang} />;
}
