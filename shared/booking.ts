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

export const buildDateOptions = (availability: LegacyAvailability[]): DateOption[] => {
  const now = new Date();
  const options: DateOption[] = [];

  for (let index = 0; index < 14; index += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + index);
    const dayOfWeek = date.getDay();
    const template = availability.find((item) => DAY_NAME_TO_INDEX[item.day.toLowerCase()] === dayOfWeek);
    if (!template) continue;

    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const slots = Array.from(
      new Set(template.slots.map((slot) => normalizeSlotTime(slot)).filter((slot): slot is string => Boolean(slot)))
    ).sort();

    options.push({
      date: isoDate,
      label: `${template.day.slice(0, 3)} ${date.getDate()}`,
      slots,
    });
  }

  return options;
};
