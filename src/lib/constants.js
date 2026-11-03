export const CITIES = [
  'Taipei City',
  'New Taipei City',
  'Taoyuan City',
  'Hsinchu City / County',
  'Taichung City',
  'Tainan City',
  'Kaohsiung City',
  'Other / Flexible',
];

export const SCHOOL_TYPES = [
  'International School',
  'Cram School (Buxiban)',
  'Bilingual Kindergarten',
  'Public School',
  'Private School',
  'Language Center',
  'Test Prep Center',
  'University / College',
  'Other',
];

export const JOB_TYPES = ['Full-Time', 'Part-Time', 'Full or Part-Time'];

export const SUBJECTS = [
  'Kindergarten',
  'Elementary',
  'Junior high',
  'Senior high',
  'Adults / Business',
  'IELTS / TOEFL prep',
  'Conversation',
  'Homeroom teacher',
  'Math / Science',
  'Private tutoring',
];

export const EDUCATION = [
  'High school diploma',
  "Associate's degree",
  "Bachelor's degree",
  "Master's degree",
  'PhD',
];

export const CERTIFICATES = [
  'TEFL / TESOL / CELTA',
  'Teaching license (home country)',
  "Master's in Education / TESOL",
  'None yet',
];

export const EXPERIENCE = [
  { value: '0', label: 'No experience yet' },
  { value: '1', label: 'Under 1 year' },
  { value: '1-2', label: '1–2 years' },
  { value: '3-5', label: '3–5 years' },
  { value: '6-10', label: '6–10 years' },
  { value: '10+', label: 'More than 10 years' },
];

export const VISA_STATUSES = [
  { value: 'arc_open', label: 'ARC that lets me work for any employer (spouse of a Taiwan national, permanent resident, Gold Card…)' },
  { value: 'arc_employer', label: 'Work ARC tied to my current employer' },
  { value: 'arc_student', label: 'Student ARC' },
  { value: 'working_holiday', label: 'Working Holiday visa' },
  { value: 'visitor', label: 'Visitor / visa-exempt entry' },
  { value: 'other', label: 'Other' },
];

export const VISA_SHORT = {
  arc_open: 'Open-work ARC',
  arc_employer: 'Employer-tied work ARC',
  arc_student: 'Student ARC',
  working_holiday: 'Working Holiday',
  visitor: 'Visitor / visa-exempt',
  other: 'Other visa',
};

export const ARC_NEEDS = [
  { value: 'yes', label: 'Yes – I need the school to sponsor my work permit & ARC' },
  { value: 'no', label: 'No – I can already work legally in Taiwan' },
  { value: 'unsure', label: "I'm not sure yet" },
];

export const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

export const SLOTS = [
  { key: 'morning', label: 'Morning', hint: 'before 12:00' },
  { key: 'afternoon', label: 'Afternoon', hint: '12:00–17:00' },
  { key: 'evening', label: 'Evening', hint: 'after 17:00' },
];

export const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(`${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtMonth = (d) => {
  if (!d) return '';
  const date = new Date(`${d}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

export const experienceLabel = (v) => EXPERIENCE.find((e) => e.value === v)?.label || '';

// Google Maps links. A school may paste a Google Maps link; if not (or if it is not a Google
// link) we build a search link from the address, so "Open in Google Maps" always works.
const GOOGLE_MAPS_HOST = /^https:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i;
export const isGoogleMapsLink = (v) => GOOGLE_MAPS_HOST.test((v || '').trim());
export const mapsUrl = (loc) =>
  isGoogleMapsLink(loc?.maps_url)
    ? loc.maps_url.trim()
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc?.address || '')}`;

// Rough city centres, used on the map for jobs whose address could not be placed exactly.
export const CITY_COORDS = {
  'Taipei City': [25.0375, 121.5637],
  'New Taipei City': [25.0120, 121.4650],
  'Taoyuan City': [24.9937, 121.3010],
  'Hsinchu City / County': [24.8138, 120.9675],
  'Taichung City': [24.1477, 120.6736],
  'Tainan City': [22.9999, 120.2270],
  'Kaohsiung City': [22.6273, 120.3014],
};
