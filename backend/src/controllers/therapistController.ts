import { Request, Response } from 'express';
import { Therapist, Availability, Review } from '../models';
import { extractWeeklyTemplate } from '../utils/schedule';
import { sendData, sendError } from '../lib/http';

const toDateString = (d: Date) => d.toISOString().slice(0, 10);

const getAvailableTherapistIds = async (availability: 'today' | 'this_week'): Promise<any[]> => {
    const today = new Date();
    const dates: string[] = [];
    const numDays = availability === 'today' ? 1 : 7;
    for (let i = 0; i < numDays; i++) {
        const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
        dates.push(toDateString(d));
    }

    const now = new Date();

    // 1. Fetch any date-level overrides or booked slot records for these dates
    const overrideDocs = await Availability.find({ date: { $in: dates } }).lean();

    // Map of `${therapistId}_${date}` -> hasOpenSlot (boolean)
    const overrideMap = new Map<string, boolean>();
    overrideDocs.forEach((doc: any) => {
        const hasOpenSlot = (doc.slots || []).some((s: any) =>
            !s.isBooked && (!s.reservedUntil || new Date(s.reservedUntil) <= now)
        );
        overrideMap.set(`${doc.therapistId.toString()}_${doc.date}`, hasOpenSlot);
    });

    // 2. Fetch all therapists (with weeklyAvailability and availability templates)
    const allTherapists = await Therapist.find({}, { _id: 1, weeklyAvailability: 1, availability: 1 }).lean();

    const availableIds: any[] = [];

    for (const t of allTherapists) {
        const tId = t._id.toString();
        const weeklyTemplate = extractWeeklyTemplate(t);

        // Check if therapist has an open slot on AT LEAST ONE date in the requested range
        let isAvailable = false;
        for (const dateStr of dates) {
            const overrideKey = `${tId}_${dateStr}`;
            if (overrideMap.has(overrideKey)) {
                if (overrideMap.get(overrideKey) === true) {
                    isAvailable = true;
                    break;
                }
                // If override exists and hasOpenSlot is false, this specific date is fully booked/blocked.
                continue;
            }

            // If no date-level record exists, fall back to the therapist's recurring weekly template
            const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
            const dow = dateObj.getUTCDay();
            const templateForDay = weeklyTemplate.find(item => item.dayOfWeek === dow);
            if (templateForDay && Array.isArray(templateForDay.slots) && templateForDay.slots.length > 0) {
                isAvailable = true;
                break;
            }
        }

        if (isAvailable) {
            availableIds.push(t._id);
        }
    }

    return availableIds;
};

export const getTherapists = async (req: Request, res: Response) => {
    try {
        const { 
            gender, 
            price, 
            minPrice, 
            maxPrice, 
            language, 
            languages, 
            sessionType, 
            sessionTypes, 
            specialty, 
            rating, 
            search, 
            availability, 
            sort, 
            limit = 10, 
            page = 1 
        } = req.query;

        const query: any = {};

        if (search && typeof search === 'string' && search.trim() !== '') {
            const searchTerm = search.trim();
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { specialties: { $regex: searchTerm, $options: 'i' } },
                { bio: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        // Gender filter
        if (gender && typeof gender === 'string' && gender !== 'All' && gender !== 'All Genders') {
            const g = gender.trim();
            query.gender = { $in: [g, g.toLowerCase(), g.charAt(0).toUpperCase() + g.slice(1).toLowerCase(), new RegExp(`^${g}$`, 'i')] };
        }

        // Price filter (supports minPrice/maxPrice or price range strings like '1000-2000', '3000+')
        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceQuery: Record<string, number> = {};
            if (minPrice !== undefined && !isNaN(Number(minPrice))) priceQuery.$gte = Number(minPrice);
            if (maxPrice !== undefined && !isNaN(Number(maxPrice))) priceQuery.$lte = Number(maxPrice);
            if (Object.keys(priceQuery).length > 0) {
                query.price = priceQuery;
            }
        } else if (price && typeof price === 'string' && price !== 'Any Price Range' && price !== 'Any') {
            const priceQuery: Record<string, number> = {};
            if (price.includes('-')) {
                const parts = price.replace(/[^\d-]/g, '').split('-');
                if (parts[0]) priceQuery.$gte = Number(parts[0]);
                if (parts[1]) priceQuery.$lte = Number(parts[1]);
            } else if (price.includes('+') || price.toLowerCase().includes('above')) {
                const minStr = price.replace(/[^\d]/g, '');
                if (minStr) priceQuery.$gte = Number(minStr);
            } else if (price.toLowerCase().includes('under') || price.toLowerCase().includes('below') || price.includes('<')) {
                const maxStr = price.replace(/[^\d]/g, '');
                if (maxStr) priceQuery.$lte = Number(maxStr);
            }
            if (Object.keys(priceQuery).length > 0) {
                query.price = priceQuery;
            }
        }

        // Language filter (supports singular language or multi languages)
        const langList: string[] = [];
        if (languages) {
            const arr = Array.isArray(languages) ? languages : [languages];
            arr.forEach(l => typeof l === 'string' && l !== 'All Languages' && l !== 'All' && langList.push(l.trim()));
        } else if (language && typeof language === 'string' && language !== 'All Languages' && language !== 'All') {
            langList.push(language.trim());
        }
        if (langList.length > 0) {
            query.languages = { $in: langList.map(l => new RegExp(`^${l}$`, 'i')) };
        }

        // Session Type filter (supports single or multi)
        const sessionList: string[] = [];
        if (sessionTypes) {
            const arr = Array.isArray(sessionTypes) ? sessionTypes : [sessionTypes];
            arr.forEach(st => typeof st === 'string' && st !== 'All Session Types' && st !== 'All' && sessionList.push(st.trim()));
        } else if (sessionType && typeof sessionType === 'string' && sessionType !== 'All Session Types' && sessionType !== 'All') {
            sessionList.push(sessionType.trim());
        }
        if (sessionList.length > 0) {
            const regexList: RegExp[] = [];
            for (const st of sessionList) {
                if (st.toLowerCase() === 'in-person' || st.toLowerCase() === 'in person') {
                    regexList.push(/^in-?person$/i);
                } else {
                    regexList.push(new RegExp(`^${st}$`, 'i'));
                }
            }
            query.sessionTypes = { $in: regexList };
        }

        if (specialty && typeof specialty === 'string' && specialty !== 'All') {
            query.specialties = { $in: [specialty] };
        }

        if (rating && !isNaN(Number(rating))) {
            query.ratingAverage = { $gte: Number(rating) };
        }

        let thisWeekIdsSet: Set<string> | null = null;
        if (availability === 'today' || availability === 'this_week') {
            const availableTherapistIds = await getAvailableTherapistIds(availability as 'today' | 'this_week');
            if (availability === 'this_week') {
                thisWeekIdsSet = new Set(availableTherapistIds.map(id => id.toString()));
            }
            query._id = { $in: availableTherapistIds };
        }

        const sortMap: Record<string, Record<string, 1 | -1>> = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            rating_desc: { ratingAverage: -1 },
        };
        const sortObj = sortMap[sort as string] ?? { ratingAverage: -1 };

        const skip = (Number(page) - 1) * Number(limit);

        // Run database query and count concurrently for optimal latency
        const [therapists, total, allLanguages] = await Promise.all([
            Therapist.find(query)
                .skip(skip)
                .limit(Number(limit))
                .sort(sortObj)
                .lean(),
            Therapist.countDocuments(query),
            Therapist.distinct('languages')
        ]);

        if (!thisWeekIdsSet) {
            const thisWeekIds = await getAvailableTherapistIds('this_week');
            thisWeekIdsSet = new Set(thisWeekIds.map(id => id.toString()));
        }

        const normalizedTherapists = therapists.map((therapist: any) => ({
            ...therapist,
            weeklyAvailability: therapist.weeklyAvailability?.length
                ? therapist.weeklyAvailability
                : extractWeeklyTemplate(therapist),
            isAvailableThisWeek: thisWeekIdsSet!.has(therapist._id.toString()),
        }));

        return sendData(res, {
            therapists: normalizedTherapists,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)) || 1,
            total,
            allLanguages,
        });
    } catch (error) {
        return sendError(res, 500, 'Server error fetching therapists', { code: 'THERAPIST_LIST_FAILED' });
    }
};

export const getTherapistById = async (req: Request, res: Response) => {
    try {
        const therapist = await Therapist.findById(req.params.id);

        if (therapist) {
            const obj = therapist.toObject();
            if (!obj.weeklyAvailability || obj.weeklyAvailability.length === 0) {
                obj.weeklyAvailability = extractWeeklyTemplate(obj);
            }
            const reviews = await Review.find({ therapistId: therapist._id }).sort({ createdAt: -1 }).lean();
            (obj as any).reviews = reviews;
            return sendData(res, obj);
        } else {
            return sendError(res, 404, 'Therapist not found', { code: 'THERAPIST_NOT_FOUND' });
        }
    } catch (error) {
        return sendError(res, 500, 'Server error fetching therapist details', { code: 'THERAPIST_GET_FAILED' });
    }
};

// Admin route to create a therapist
export const createTherapist = async (req: Request, res: Response) => {
    try {
        const payload = { ...req.body, weeklyAvailability: extractWeeklyTemplate(req.body) };
        const therapist = await Therapist.create(payload);
        return sendData(res, therapist, 201);
    } catch (error) {
        return sendError(res, 400, 'Invalid data', { code: 'THERAPIST_CREATE_INVALID' });
    }
};
