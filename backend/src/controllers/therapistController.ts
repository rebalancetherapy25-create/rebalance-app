import { Request, Response } from 'express';
import { Therapist, Availability, Review } from '../models';
import { extractWeeklyTemplate } from '../utils/schedule';
import { sendData, sendError } from '../lib/http';

const toDateString = (d: Date) => d.toISOString().slice(0, 10);

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

        // Language filter
        const langArg = language || languages;
        if (langArg && typeof langArg === 'string' && langArg !== 'All' && langArg !== 'All Languages') {
            const langList = langArg.split(',').map(l => l.trim()).filter(Boolean);
            const regexList = langList.map(l => new RegExp(`^${l}$`, 'i'));
            query.languages = { $in: regexList };
        }

        // Session Type filter (Video/Audio)
        const stArg = sessionType || sessionTypes;
        if (stArg && typeof stArg === 'string' && stArg !== 'All' && stArg !== 'All Session Types') {
            const stList = stArg.split(',').map(s => s.trim()).filter(Boolean);
            const regexList: RegExp[] = [];
            for (const st of stList) {
                if (st.toLowerCase() === 'audio' || st.toLowerCase() === 'phone') {
                    regexList.push(new RegExp('^audio$', 'i'), new RegExp('^phone$', 'i'));
                } else if (st.toLowerCase() === 'online' || st.toLowerCase() === 'video') {
                    regexList.push(new RegExp('^video$', 'i'), new RegExp('^online$', 'i'));
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

        if (availability === 'today' || availability === 'this_week') {
            const today = toDateString(new Date());
            const dateQuery = availability === 'today'
                ? { date: today }
                : { date: { $gte: today, $lte: toDateString(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)) } };

            const therapistIds = await Availability.distinct('therapistId', {
                ...dateQuery,
                'slots': { $elemMatch: { isBooked: false, $or: [{ reservedUntil: { $exists: false } }, { reservedUntil: { $lte: new Date() } }] } },
            });
            query._id = { $in: therapistIds };
        }

        const sortMap: Record<string, Record<string, 1 | -1>> = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            rating_desc: { ratingAverage: -1 },
        };
        const sortObj = sortMap[sort as string] ?? { ratingAverage: -1 };

        const skip = (Number(page) - 1) * Number(limit);

        // Run database query and count concurrently for optimal latency
        const [therapists, total] = await Promise.all([
            Therapist.find(query)
                .skip(skip)
                .limit(Number(limit))
                .sort(sortObj)
                .lean(),
            Therapist.countDocuments(query)
        ]);

        const normalizedTherapists = therapists.map((therapist: any) => ({
            ...therapist,
            weeklyAvailability: therapist.weeklyAvailability?.length
                ? therapist.weeklyAvailability
                : extractWeeklyTemplate(therapist),
        }));

        return sendData(res, {
            therapists: normalizedTherapists,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)) || 1,
            total,
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
