const EN_IN_LOCALE = 'en-IN';

export const bookingDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`);

/** Converts a 24-hour HH:mm string (e.g. "14:30") to 12-hour display (e.g. "2:30 PM"). */
export const formatSlotTime = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

export const formatBookingDate = (date: string, time: string, locale = EN_IN_LOCALE) => (
  bookingDateTime(date, time).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
);

export const formatCalendarDate = (date: string, locale = EN_IN_LOCALE) => (
  new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
);
