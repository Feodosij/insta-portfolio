import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadSignatureParams = Record<string, string | number>;

export function buildUploadSignature(
  paramsToSign: UploadSignatureParams,
  apiSecret: string = process.env.CLOUDINARY_API_SECRET!,
): string {
  return cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
}

export default cloudinary;
