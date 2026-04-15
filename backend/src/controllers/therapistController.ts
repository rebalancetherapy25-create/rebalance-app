import { Request, Response } from 'express';
import { Therapist, Availability } from '../models';
import { extractWeeklyTemplate } from '../utils/schedule';

const toDateString = (d: Date) => d.toISOString().slice(0, 10);

export const getTherapists = async (req: Request, res: Response) => {
    try {
        const { specialty, minPrice, maxPrice, rating, search, availability, sort, limit = 10, page = 1 } = req.query;

        const query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search as string, $options: 'i' } },
                { specialties: { $regex: search as string, $options: 'i' } }
            ];
        }

        if (specialty) {
            query.specialties = { $in: [specialty] };
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (rating) {
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

        const therapists = await Therapist.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort(sortObj)
            .lean();

        const normalizedTherapists = therapists.map((therapist: any) => ({
            ...therapist,
            weeklyAvailability: therapist.weeklyAvailability?.length
                ? therapist.weeklyAvailability
                : extractWeeklyTemplate(therapist),
        }));

        const total = await Therapist.countDocuments(query);

        res.status(200).json({
            therapists: normalizedTherapists,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            total,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching therapists' });
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
            res.status(200).json(obj);
        } else {
            res.status(404).json({ error: 'Therapist not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching therapist details' });
    }
};

// Admin route to create a therapist
export const createTherapist = async (req: Request, res: Response) => {
    try {
        const payload = { ...req.body, weeklyAvailability: extractWeeklyTemplate(req.body) };
        const therapist = await Therapist.create(payload);
        res.status(201).json(therapist);
    } catch (error) {
        res.status(400).json({ error: 'Invalid data' });
    }
};
