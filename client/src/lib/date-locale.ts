import { format, formatRelative, formatDistance, parseISO } from 'date-fns';
import { enUS, es, pl } from 'date-fns/locale';

// Map language codes to date-fns locales
const localeMap = {
  en: enUS,
  es: es,
  pl: pl,
} as const;

type SupportedLanguage = keyof typeof localeMap;

/**
 * Get the appropriate date-fns locale for the given language code
 */
export function getDateLocale(language: string) {
  return localeMap[language as SupportedLanguage] || enUS;
}

/**
 * Format a date using the specified language locale
 */
export function formatDate(
  date: Date | string,
  formatStr: string,
  language: string = 'en'
) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const locale = getDateLocale(language);
  return format(dateObj, formatStr, { locale });
}

/**
 * Format a date relative to now using the specified language locale
 */
export function formatRelativeDate(
  date: Date | string,
  baseDate: Date = new Date(),
  language: string = 'en'
) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const locale = getDateLocale(language);
  return formatRelative(dateObj, baseDate, { locale });
}

/**
 * Format the distance between two dates using the specified language locale
 */
export function formatDateDistance(
  date: Date | string,
  baseDate: Date = new Date(),
  language: string = 'en'
) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const locale = getDateLocale(language);
  return formatDistance(dateObj, baseDate, { locale });
}

/**
 * Common date format patterns
 */
export const dateFormats = {
  short: 'MMM d, yyyy', // Jan 15, 2024
  medium: 'MMM d, yyyy', // Jan 15, 2024
  long: 'MMMM d, yyyy', // January 15, 2024
  full: 'EEEE, MMMM d, yyyy', // Monday, January 15, 2024
  time: 'h:mm a', // 2:30 PM
  dateTime: 'MMM d, yyyy h:mm a', // Jan 15, 2024 2:30 PM
  iso: 'yyyy-MM-dd', // 2024-01-15
} as const;

/**
 * Format a date with a predefined pattern
 */
export function formatDateWithPattern(
  date: Date | string,
  pattern: keyof typeof dateFormats,
  language: string = 'en'
) {
  return formatDate(date, dateFormats[pattern], language);
}

/**
 * Get a user-friendly date string for display
 */
export function getDisplayDate(
  date: Date | string,
  language: string = 'en'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  // If it's today, show relative time
  if (diffInDays === 0) {
    return formatRelativeDate(dateObj, now, language);
  }
  
  // If it's within a week, show relative time
  if (diffInDays < 7) {
    return formatDateDistance(dateObj, now, language);
  }
  
  // Otherwise, show formatted date
  return formatDateWithPattern(dateObj, 'medium', language);
}
