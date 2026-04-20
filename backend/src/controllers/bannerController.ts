import { Request, Response } from 'express';
import { Banner } from '../models';
import { sendData, sendError } from '../lib/http';

export const getBanners = async (req: Request, res: Response) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
        return sendData(res, banners);
    } catch (error) {
        return sendError(res, 500, 'Server error fetching banners', { code: 'BANNER_FETCH_FAILED' });
    }
};

export const createBanner = async (req: Request, res: Response) => {
    try {
        const { title, isActive } = req.body;

        let imageUrl = '';
        if ((req as any).file) {
            imageUrl = (req as any).file.path;
        } else if (req.body.imageUrl) {
            imageUrl = req.body.imageUrl;
        } else {
            return sendError(res, 400, 'Image is required', { code: 'BANNER_IMAGE_REQUIRED' });
        }

        const banner = await Banner.create({
            title,
            imageUrl,
            isActive: isActive === 'true' || isActive === true,
        });

        return sendData(res, banner, 201);
    } catch (error) {
        console.error('Error creating banner:', error);
        return sendError(res, 500, 'Server error creating banner', { code: 'BANNER_CREATE_FAILED' });
    }
};

export const updateBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, isActive } = req.body;

        const banner = await Banner.findById(id);

        if (!banner) {
            return sendError(res, 404, 'Banner not found', { code: 'BANNER_NOT_FOUND' });
        }

        if (title) banner.title = title;
        if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;

        if ((req as any).file) {
            banner.imageUrl = (req as any).file.path;
        } else if (req.body.imageUrl) {
            banner.imageUrl = req.body.imageUrl;
        }

        await banner.save();

        return sendData(res, banner);
    } catch (error) {
        console.error('Error updating banner:', error);
        return sendError(res, 500, 'Server error updating banner', { code: 'BANNER_UPDATE_FAILED' });
    }
};

export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findByIdAndDelete(id);

        if (!banner) {
            return sendError(res, 404, 'Banner not found', { code: 'BANNER_NOT_FOUND' });
        }

        // Ideally, we could also delete the image from Cloudinary here
        // const publicId = banner.imageUrl.split('/').pop()?.split('.')[0];
        // if (publicId) await cloudinary.uploader.destroy(`rebalance_banners/${publicId}`);

        return sendData(res, { message: 'Banner deleted successfully' });
    } catch (error) {
        return sendError(res, 500, 'Server error deleting banner', { code: 'BANNER_DELETE_FAILED' });
    }
};
