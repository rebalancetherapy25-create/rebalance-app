export type LegacyAvailability = {
  day: string;
  slots: string[];
};

export type DateOption = {
  date: string;
  label: string;
  slots: string[];
};

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const normalizeSlotTime = (slot: string): string | null => {
  const value = slot.trim();
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const [hour, minute] = value.split(':').map(Number);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
    return null;
  }

  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (hour === 12) hour = 0;
  if (meridiem === 'PM') hour += 12;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const getTodayDateStringIST = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

export const isSlotInPast = (date: string, time: string, bufferMinutes = 0): boolean => {
  const normalizedTime = normalizeSlotTime(time);
  if (!normalizedTime || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const slotTimestamp = new Date(`${date}T${normalizedTime}:00+05:30`).getTime();
  if (Number.isNaN(slotTimestamp)) return false;

  return slotTimestamp <= Date.now() + bufferMinutes * 60 * 1000;
};

export const filterPastSlots = (date: string, slots: string[], bufferMinutes = 0): string[] => {
  return slots.filter((slot) => !isSlotInPast(date, slot, bufferMinutes));
};

export const buildDateOptions = (availability: any[] = []): DateOption[] => {
  const todayStr = getTodayDateStringIST();
  const [y, m, d] = todayStr.split('-').map(Number);
  const baseDate = new Date(y, m - 1, d);
  const options: DateOption[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let index = 0; index < 30; index += 1) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + index);
    const dayOfWeek = date.getDay();
    const template = availability.find((item: any) => {
      if (item && typeof item.dayOfWeek === 'number') {
        return item.dayOfWeek === dayOfWeek;
      }
      if (item && typeof item.day === 'string') {
        return DAY_NAME_TO_INDEX[item.day.toLowerCase()] === dayOfWeek;
      }
      return false;
    });

    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const rawSlots: string[] = template && Array.isArray(template.slots) ? template.slots.map(String) : [];
    const normalized: string[] = rawSlots.map(normalizeSlotTime).filter((s: string | null): s is string => Boolean(s));
    const slots: string[] = [];
    new Set<string>(normalized).forEach((val: string) => slots.push(val));
    slots.sort();

    const availableSlots = filterPastSlots(isoDate, slots);
    const shortDay = template && typeof template.day === 'string' ? template.day.slice(0, 3) : dayNames[dayOfWeek];

    options.push({
      date: isoDate,
      label: `${shortDay} ${date.getDate()}`,
      slots: availableSlots,
    });
  }

  return options;
};

