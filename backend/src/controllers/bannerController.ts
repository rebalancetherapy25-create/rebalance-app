import { Request, Response } from 'express';
import { Banner } from '../models';

export const getBanners = async (req: Request, res: Response) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json(banners);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching banners' });
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
            return res.status(400).json({ error: 'Image is required' });
        }

        const banner = await Banner.create({
            title,
            imageUrl,
            isActive: isActive === 'true' || isActive === true,
        });

        res.status(201).json(banner);
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({ error: 'Server error creating banner' });
    }
};

export const updateBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, isActive } = req.body;

        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ error: 'Banner not found' });
        }

        if (title) banner.title = title;
        if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;

        if ((req as any).file) {
            banner.imageUrl = (req as any).file.path;
        } else if (req.body.imageUrl) {
            banner.imageUrl = req.body.imageUrl;
        }

        await banner.save();

        res.status(200).json(banner);
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({ error: 'Server error updating banner' });
    }
};

export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findByIdAndDelete(id);

        if (!banner) {
            return res.status(404).json({ error: 'Banner not found' });
        }

        // Ideally, we could also delete the image from Cloudinary here
        // const publicId = banner.imageUrl.split('/').pop()?.split('.')[0];
        // if (publicId) await cloudinary.uploader.destroy(`rebalance_banners/${publicId}`);

        res.status(200).json({ message: 'Banner deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting banner' });
    }
};
