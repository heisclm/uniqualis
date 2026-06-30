import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration
// These environment variables need to be set in the .env file:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads an image to Cloudinary and returns the URL.
 * 
 * @param fileData - Base64 encoded string or file path
 * @param folder - Folder path in Cloudinary (e.g., 'uniqualis/profiles')
 * @returns Promise<string> - The secure URL of the uploaded image
 */
export const uploadImage = async (fileData: string, folder: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export default cloudinary;
