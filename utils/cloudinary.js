import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        const result = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto' })
        if (!result) return null

        fs.unlinkSync(localFilePath)
        return result;
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return error
    }
}

const deleteOnCloudinary = async (public_id, resource_type = 'image') => {
    try {
        if (!public_id) return null;
        const result = await cloudinary.uploader.destroy(public_id, { resource_type: `${resource_type}` });
    } catch (error) {
        console.log('Delete on Cloudinary failed', error)
        return error;
    }
}


export { uploadOnCloudinary, deleteOnCloudinary }