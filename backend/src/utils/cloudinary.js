import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from 'fs';

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

const uploadOnCloudinary = async (filePath) =>{
    try{
        if(!filePath) return null;
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto"
        })
        console.log("File uploaded successfully",response.url);
        return response
    }
    catch(error){
        fs.unlinkSync(filePath);
        return null;
    }


}

const deleteFromCloudinary = async (url) => {
    try {
        if(!url) return null;
        const pubId= url.split("/upload/")[1]
        .replace(/^v\d+\//,"")
        .replace(/\.[^/.]+$/,"");
    
        console.log(`pubId : ${pubId}`);
    
        const response = await cloudinary.uploader.destroy(pubId, {
            resource_type: "image"
        })
        console.log("File deletion sucessful",response.result);
        
        return response;
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        return null;
    }

} 

export {uploadOnCloudinary, deleteFromCloudinary};