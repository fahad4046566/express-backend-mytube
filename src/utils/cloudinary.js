import { v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = (localfilepath) => {
  try {
    if(!localfilepath) return null;
    // upload the file to cloudinary and return the url of the uploaded file
    const response = await cloudinary.uploader.upload(localfilepath,{
        resource_type:"auto"
    })
   // file uploaded successfully
   console.log("file is uploaded on cloudinary",response.url);
   return response.url;
  } catch (error) {
    fs.unlinkSync(localfilepath); // delete the file from local storage if there is an error while uploading the file to cloudinary
    return null;
  }
}

export {uploadOnCloudinary};

