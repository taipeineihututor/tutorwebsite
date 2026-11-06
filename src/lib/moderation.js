// Demo-mode copy of the database content filter (supabase/moderation.sql). In live mode the database does this.
const BLOCK = [
  /\b(fuck(ing|er|ers|ed)?|motherfucker|shit(ty|head)?|bullshit|bitch(es)?|asshole|cunt|dickhead|bastard|whore|slut)\b/i,
  /\b(nigger|niggers|nigga|faggot|fag|retard|retarded|chink|spic|kike)\b/i,
  /\b(porn|porno|pornhub|nudes?|escorts?|hookups?|onlyfans|sexting|blowjob)\b/i,
  /\b(casino|gambling|bitcoin|crypto(currency)?|forex|viagra|western union|wire transfer|get rich|send me money|payday loan)\b/i,
  /\b(kill yourself|kys)\b/i,
  /(幹你|幹妳|操你|操妳|他媽的|他妈的|傻逼|傻屄|婊子|約炮|约炮|援交|色情|賭博|赌博|博彩|百家樂|百家乐|去死|肏)/,
];
const CONTACT = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /(https?:\/\/|www\.)/i,
  /\b[a-z0-9-]+\.(com|net|org|tw|io|co|info)\b/i,
  /([+]?[0-9][ .()-]?){9,}/,
  /\b(whatsapp|wechat|telegram|messenger|skype|line ?id)\b/i,
];

export function moderationCheck(text, contact) {
  const t = String(text || '');
  if (BLOCK.some((r) => r.test(t))) return 'blocked';
  if (contact && CONTACT.some((r) => r.test(t))) return 'contact';
  return null;
}

export const moderationNote = (r) => (r === 'contact'
  ? 'Automatic check: your text seems to contain an email address, phone number, chat ID or web link. Verified schools already see your contact details, so please remove it from your text and save again. We will also look at it shortly.'
  : 'Automatic check: your text contains wording that is not allowed on TeachFormosa. Please edit it and save again. We will also look at it shortly.');

export const teacherText = (t) => [t.full_name, t.bio, t.nationality, JSON.stringify(t.availability_notes || {})].filter(Boolean).join(' ');
export const jobText = (j) => [j.title, j.school_name, j.description, j.requirements, j.schedule, j.salary, j.contact_name].filter(Boolean).join(' ');
