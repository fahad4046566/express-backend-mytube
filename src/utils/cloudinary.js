import { v2 as cloudinary} from "cloudinary";
import streamifier from "streamifier"; // it allows us to convert a buffer into a readable stream, which can be used to upload files to Cloudinary without saving them to disk first
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

// const uploadOnCloudinary = async(localfilepath) => {
//   try {
//     if(!localfilepath) return null;
//     // upload the file to cloudinary and return the url of the uploaded file
//     const response = await cloudinary.uploader.upload(localfilepath,{
//         resource_type:"auto"
//     })
//    // file uploaded successfully
//    fs.unlinkSync(localfilepath)
//    return response.url;
//   } catch (error) {
//     fs.unlinkSync(localfilepath); // delete the file from local storage if there is an error while uploading the file to cloudinary
//     return null;
//   }
// }
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


export {uploadOnCloudinary};

