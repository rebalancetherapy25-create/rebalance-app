export const formatSlotTime = (time: string): string => {
    const parts = time.split(':');
    const h = Number(parts[0] ?? '');
    const m = Number(parts[1] ?? '');
    if (Number.isNaN(h) || Number.isNaN(m)) return time;
    const period = h < 12 ? 'AM' : 'PM';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
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

export const normalizeDate = (value: string): string | null => {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0] || null;
};

const formatTwo = (value: number) => String(value).padStart(2, '0');

export const normalizeTime = (value: string): string | null => {
    if (!value) return null;

    const simple = value.trim();
    const simpleMatch = simple.match(/^(\d{1,2}):(\d{2})$/);
    if (simpleMatch) {
        const rawHour = Number(simpleMatch[1]);
        const rawMinute = Number(simpleMatch[2]);
        if (rawHour < 0 || rawHour > 23 || rawMinute < 0 || rawMinute > 59) return null;
        return `${formatTwo(rawHour)}:${formatTwo(rawMinute)}`;
    }

    const ampmMatch = simple.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!ampmMatch) return null;

    let hour = Number(ampmMatch[1]);
    const minute = Number(ampmMatch[2]);
    const modifier = (ampmMatch[3] || '').toUpperCase();

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    if (hour === 12) hour = 0;
    if (modifier === 'PM') hour += 12;

    return `${formatTwo(hour)}:${formatTwo(minute)}`;
};

export interface WeeklyTemplateSlot {
    dayOfWeek: number;
    slots: string[];
}

const normalizeSlots = (slots: string[] = []): string[] => {
    const normalized = slots
        .map((slot) => normalizeTime(slot))
        .filter((slot): slot is string => Boolean(slot));
    return Array.from(new Set(normalized)).sort();
};

export const extractWeeklyTemplate = (therapist: any): WeeklyTemplateSlot[] => {
    const weekly = Array.isArray(therapist?.weeklyAvailability) ? therapist.weeklyAvailability : [];
    if (weekly.length > 0) {
        return weekly
            .map((entry: any) => ({
                dayOfWeek: Number(entry.dayOfWeek),
                slots: normalizeSlots(entry.slots || []),
            }))
            .filter((entry: WeeklyTemplateSlot) => Number.isInteger(entry.dayOfWeek) && entry.dayOfWeek >= 0 && entry.dayOfWeek <= 6);
    }

    const legacy = Array.isArray(therapist?.availability) ? therapist.availability : [];
    return legacy
        .map((entry: any) => ({
            dayOfWeek: DAY_NAME_TO_INDEX[String(entry.day || '').toLowerCase()],
            slots: normalizeSlots(entry.slots || []),
        }))
        .filter((entry: WeeklyTemplateSlot) => Number.isInteger(entry.dayOfWeek));
};

export const getTemplateSlotsForDate = (therapist: any, normalizedDate: string): string[] => {
    const date = new Date(`${normalizedDate}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return [];

    const dayOfWeek = date.getUTCDay();
    const weeklyTemplate = extractWeeklyTemplate(therapist);
    const match = weeklyTemplate.find((entry) => entry.dayOfWeek === dayOfWeek);
    return match?.slots || [];
};
