const EN_IN_LOCALE = 'en-IN';

export const bookingDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`);

export const formatBookingDate = (date: string, time: string, locale = EN_IN_LOCALE) => (
  bookingDateTime(date, time).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
);

export const formatCalendarDate = (date: string, locale = EN_IN_LOCALE) => (
  new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
);
