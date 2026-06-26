/**
 * lib/pii.ts — Client-side PII detection & redaction
 * Detects: emails, phone numbers, SSNs, credit cards, IP addresses, dates of birth
 */

export interface PIIMatch {
  type:  PIIType;
  value: string;
  start: number;
  end:   number;
  risk:  'high' | 'medium' | 'low';
}

export type PIIType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'dob'
  | 'passport'
  | 'bank_account';

const PATTERNS: { type: PIIType; regex: RegExp; risk: PIIMatch['risk'] }[] = [
  {
    type:  'email',
    regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    risk:  'medium',
  },
  {
    type:  'phone',
    regex: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    risk:  'medium',
  },
  {
    type:  'ssn',
    regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    risk:  'high',
  },
  {
    type:  'credit_card',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    risk:  'high',
  },
  {
    type:  'ip_address',
    regex: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    risk:  'low',
  },
  {
    type:  'passport',
    regex: /\b[A-Z]{1,2}[0-9]{6,9}\b/g,
    risk:  'high',
  },
  {
    type:  'bank_account',
    regex: /\b\d{8,17}\b/g,
    risk:  'medium',
  },
];

const RISK_LABELS: Record<PIIMatch['risk'], string> = {
  high:   '🔴 High Risk',
  medium: '🟡 Medium Risk',
  low:    '🟢 Low Risk',
};

export function detectPII(text: string): PIIMatch[] {
  const matches: PIIMatch[] = [];
  for (const { type, regex, risk } of PATTERNS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      matches.push({ type, value: m[0], start: m.index, end: m.index + m[0].length, risk });
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

export function redactPII(text: string, types?: PIIType[]): { redacted: string; count: number } {
  const matches = detectPII(text).filter((m) => !types || types.includes(m.type));
  let result = text;
  let offset = 0;
  let count  = 0;
  for (const m of matches) {
    const placeholder = `[${m.type.toUpperCase()}_REDACTED]`;
    result = result.slice(0, m.start + offset) + placeholder + result.slice(m.end + offset);
    offset += placeholder.length - (m.end - m.start);
    count++;
  }
  return { redacted: result, count };
}

export function maskValue(value: string, type: PIIType): string {
  switch (type) {
    case 'email': {
      const [user, domain] = value.split('@');
      return `${user.slice(0, 2)}***@${domain}`;
    }
    case 'credit_card':
      return `****-****-****-${value.slice(-4)}`;
    case 'ssn':
      return `***-**-${value.slice(-4)}`;
    case 'phone':
      return `***-***-${value.slice(-4)}`;
    case 'passport':
      return `${value.slice(0, 2)}*****`;
    default:
      return '***';
  }
}

export function riskLabel(risk: PIIMatch['risk']): string {
  return RISK_LABELS[risk];
}

export function piiSummary(matches: PIIMatch[]): Record<PIIType, number> {
  const summary = {} as Record<PIIType, number>;
  for (const m of matches) {
    summary[m.type] = (summary[m.type] ?? 0) + 1;
  }
  return summary;
}
