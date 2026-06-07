import { v2 as cloudinary} from "cloudinary";
import streamifier from "streamifier"; // it allows us to convert a buffer into a readable stream, which can be used to upload files to Cloudinary without saving them to disk first
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    if (!buffer) return reject(null);

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.url);   // Cloudinary se mili URL return 
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};


const deleteImageFromCloudinary = (publicId , resource_type = "image") => {
  return new Promise((resolve, reject) => {
    if (!publicId) return reject(new Error("publicId is required")); 

    cloudinary.uploader.destroy(publicId,{ resource_type: resource_type },(error, result) => {
        console.log("Cloudinary destroy result:", result);
        if (error) {
          reject(error);
        } else {
          resolve(result.result === "ok");   
        }
      }
    );
  });
};

const deleteVideoFromCloudinary = (publicId , resource_type = "video") => {
  return new Promise((resolve, reject) => {
    if (!publicId) return reject(new Error("publicId is required")); 

    cloudinary.uploader.destroy(publicId,{ resource_type: resource_type },(error, result) => {
        console.log("Cloudinary destroy result:", result);
        if (error) {
          reject(error);
        } else {
          resolve(result.result === "ok");   
        }
      }
    );
  });
};


export {uploadOnCloudinary , deleteImageFromCloudinary , deleteVideoFromCloudinary};

