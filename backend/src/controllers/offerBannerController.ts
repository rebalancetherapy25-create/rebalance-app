import { Request, Response } from 'express';
import { OfferBanner } from '../models/OfferBanner';
import { sendData, sendError } from '../lib/http';

export const getOfferBanners = async (req: Request, res: Response) => {
    try {
        const banners = await OfferBanner.find({ isActive: true }).sort({ createdAt: -1 });
        return sendData(res, banners);
    } catch (error) {
        return sendError(res, 500, 'Server error fetching offer banners', { code: 'OFFER_BANNER_FETCH_FAILED' });
    }
};

export const getAllOfferBanners = async (req: Request, res: Response) => {
    try {
        const banners = await OfferBanner.find({}).sort({ createdAt: -1 });
        return sendData(res, banners);
    } catch (error) {
        return sendError(res, 500, 'Server error fetching offer banners', { code: 'OFFER_BANNER_FETCH_FAILED' });
    }
};

export const createOfferBanner = async (req: Request, res: Response) => {
    try {
        const { type, text, code, link, isActive } = req.body;
        
        let mobileImageUrl = req.body.mobileImageUrl || '';
        let desktopImageUrl = req.body.desktopImageUrl || '';

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        if (files) {
            if (files['mobileImage']?.[0]) {
                mobileImageUrl = files['mobileImage'][0].path;
            }
            if (files['desktopImage']?.[0]) {
                desktopImageUrl = files['desktopImage'][0].path;
            }
        }

        if (type === 'text' && !text) {
            return sendError(res, 400, 'Text is required for a text offer banner', { code: 'OFFER_BANNER_TEXT_REQUIRED' });
        }

        if (type === 'image' && !mobileImageUrl && !desktopImageUrl) {
            return sendError(res, 400, 'Image files are required for an image offer banner', { code: 'OFFER_BANNER_IMAGES_REQUIRED' });
        }

        const banner = await OfferBanner.create({
            type: type || 'text',
            text: text || '',
            code: code || '',
            link: link || '',
            mobileImageUrl,
            desktopImageUrl,
            isActive: isActive === 'true' || isActive === true,
        });

        return sendData(res, banner, 201);
    } catch (error) {
        console.error('Error creating offer banner:', error);
        return sendError(res, 500, 'Server error creating offer banner', { code: 'OFFER_BANNER_CREATE_FAILED' });
    }
};

export const updateOfferBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { type, text, code, link, isActive } = req.body;

        const banner = await OfferBanner.findById(id);

        if (!banner) {
            return sendError(res, 404, 'Offer banner not found', { code: 'OFFER_BANNER_NOT_FOUND' });
        }

        let mobileImageUrl = req.body.mobileImageUrl;
        let desktopImageUrl = req.body.desktopImageUrl;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        if (files) {
            if (files['mobileImage']?.[0]) {
                mobileImageUrl = files['mobileImage'][0].path;
            }
            if (files['desktopImage']?.[0]) {
                desktopImageUrl = files['desktopImage'][0].path;
            }
        }

        if (type !== undefined) banner.type = type;
        if (text !== undefined) banner.text = text;
        if (code !== undefined) banner.code = code;
        if (link !== undefined) banner.link = link;
        if (mobileImageUrl !== undefined) banner.mobileImageUrl = mobileImageUrl;
        if (desktopImageUrl !== undefined) banner.desktopImageUrl = desktopImageUrl;
        if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;

        await banner.save();

        return sendData(res, banner);
    } catch (error) {
        console.error('Error updating offer banner:', error);
        return sendError(res, 500, 'Server error updating offer banner', { code: 'OFFER_BANNER_UPDATE_FAILED' });
    }
};

export const deleteOfferBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const banner = await OfferBanner.findByIdAndDelete(id);

        if (!banner) {
            return sendError(res, 404, 'Offer banner not found', { code: 'OFFER_BANNER_NOT_FOUND' });
        }

        return sendData(res, { message: 'Offer banner deleted successfully' });
    } catch (error) {
        return sendError(res, 500, 'Server error deleting offer banner', { code: 'OFFER_BANNER_DELETE_FAILED' });
    }
};
