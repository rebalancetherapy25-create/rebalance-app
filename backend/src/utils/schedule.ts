import { Availability } from '../models';

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
    const map = new Map<number, string[]>();
    // Guarantee independent Saturday (6) and Sunday (0) and weekday entries exist
    for (let dow = 0; dow <= 6; dow += 1) {
        map.set(dow, []);
    }

    const weekly = Array.isArray(therapist?.weeklyAvailability) ? therapist.weeklyAvailability : [];
    if (weekly.length > 0) {
        weekly.forEach((entry: any) => {
            const dow = Number(entry?.dayOfWeek);
            if (Number.isInteger(dow) && dow >= 0 && dow <= 6) {
                map.set(dow, normalizeSlots(entry.slots || []));
            }
        });
    } else {
        const legacy = Array.isArray(therapist?.availability) ? therapist.availability : [];
        legacy.forEach((entry: any) => {
            const rawDow = DAY_NAME_TO_INDEX[String(entry?.day || '').toLowerCase()];
            const dow = rawDow === undefined ? NaN : Number(rawDow);
            if (Number.isInteger(dow) && dow >= 0 && dow <= 6) {
                map.set(dow, normalizeSlots(entry.slots || []));
            }
        });
    }

    const result: WeeklyTemplateSlot[] = [];
    for (let dow = 0; dow <= 6; dow += 1) {
        result.push({ dayOfWeek: dow, slots: map.get(dow) || [] });
    }
    return result;
};

export const getTemplateSlotsForDate = (therapist: any, normalizedDate: string): string[] => {
    const date = new Date(`${normalizedDate}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) return [];

    const dayOfWeek = date.getUTCDay();
    const weeklyTemplate = extractWeeklyTemplate(therapist);
    const match = weeklyTemplate.find((entry) => entry.dayOfWeek === dayOfWeek);
    return match?.slots || [];
};

const INDEX_TO_DAY_NAME: Record<number, string> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
};

export const syncWeeklyToLegacy = (weekly: any[] = []): { day: string; slots: string[] }[] => {
    return weekly
        .map((w) => {
            const index = Number(w.dayOfWeek);
            const day = INDEX_TO_DAY_NAME[index];
            if (!day) return null;
            const slots = Array.isArray(w.slots)
                ? Array.from(new Set(w.slots.map((s: any) => normalizeTime(String(s))).filter(Boolean) as string[])).sort()
                : [];
            return { day, slots };
        })
        .filter((entry): entry is { day: string; slots: string[] } => Boolean(entry));
};

export const syncFutureAvailabilitiesWithTemplate = async (therapistId: string, weeklyTemplate: WeeklyTemplateSlot[]): Promise<number> => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const records = await Availability.find({
            therapistId,
            date: { $gte: today },
        });

        if (!records.length) {
            console.log(`[DEBUG SCHEDULE SYNC] Therapist: ${therapistId} | No existing future daily records >= ${today} found to resync.`);
            return 0;
        }

        const now = new Date();
        let updatedCount = 0;

        for (const record of records) {
            const dateObj = new Date(`${record.date}T00:00:00.000Z`);
            if (Number.isNaN(dateObj.getTime())) continue;

            const dayOfWeek = dateObj.getUTCDay();
            const targetSlots = weeklyTemplate.find((t) => t.dayOfWeek === dayOfWeek)?.slots || [];

            // Preserve slots that are actively booked or currently locked by a client
            const protectedSlots = (record.slots || []).filter((s: any) => {
                if (s.isBooked) return true;
                if (s.reservedUntil && new Date(s.reservedUntil) > now) return true;
                return false;
            });
            const protectedTimes = new Set(protectedSlots.map((s: any) => String(s.time)));

            const nextSlots = [
                ...protectedSlots,
                ...targetSlots
                    .filter((time) => !protectedTimes.has(time))
                    .map((time) => ({ time, isBooked: false })),
            ].sort((a: any, b: any) => String(a.time).localeCompare(String(b.time)));

            await Availability.updateOne({ _id: record._id }, { $set: { slots: nextSlots } });
            updatedCount += 1;
        }

        console.log(`[DEBUG SCHEDULE SYNC] Therapist: ${therapistId} | Resynced ${updatedCount} future daily records >= ${today} against new schedule template.`);
        return updatedCount;
    } catch (error) {
        console.error('[DEBUG SCHEDULE SYNC ERROR] Failed to resync future availabilities:', error);
        return 0;
    }
};

// Enforces that appointments can only be booked within the rolling 30-day window
export const isWithin30DayWindow = (dateStr: string): boolean => {
    const target = new Date(`${dateStr}T00:00:00.000Z`);
    if (Number.isNaN(target.getTime())) return false;

    const now = new Date();
    const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
    const start = new Date(`${todayStr}T00:00:00.000Z`);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 30); // precisely 30 days window

    return target >= start && target < end;
};

