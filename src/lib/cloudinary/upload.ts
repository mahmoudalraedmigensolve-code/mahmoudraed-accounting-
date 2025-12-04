// Cloudinary Upload Utility
// Client-side upload using unsigned preset

/**
 * Upload image to Cloudinary
 * @param file - File object to upload
 * @param folder - Folder name in Cloudinary (e.g., 'company-logos', 'whatsapp-qr')
 * @returns Cloudinary URL of uploaded image
 */
export async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("Cloudinary cloud name is not configured");
  }

  console.log("Uploading to Cloudinary:", {
    cloudName,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    folder,
  });

  // Create form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "accounting_app");
  formData.append("folder", folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    console.log("Cloudinary response status:", response.status);

    // Try to get response as text first
    const responseText = await response.text();
    console.log("Cloudinary raw response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response from Cloudinary: ${responseText}`);
    }

    if (!response.ok) {
      console.error("Cloudinary error response:", data);

      // Check for specific errors
      if (data.error?.message) {
        if (data.error.message.includes("Invalid upload preset") ||
            data.error.message.includes("preset")) {
          throw new Error(
            "يرجى إنشاء Upload Preset باسم 'accounting_app' في Cloudinary:\n\n" +
            "1. افتح: https://cloudinary.com/console\n" +
            "2. Settings → Upload → Upload presets\n" +
            "3. اضغط: Add upload preset\n" +
            "4. Preset name: accounting_app\n" +
            "5. Signing Mode: Unsigned ⚠️\n" +
            "6. Save"
          );
        }
        throw new Error(`Cloudinary error: ${data.error.message}`);
      }

      throw new Error(`Failed to upload image (Status: ${response.status})`);
    }

    if (!data.secure_url) {
      throw new Error("No URL returned from Cloudinary");
    }

    console.log("Upload successful:", data.secure_url);
    return data.secure_url;
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
}

/**
 * Delete image from Cloudinary (requires server-side API)
 * For now, we'll just keep images - deletion can be handled manually or via server
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  // This would need a server-side API route to work
  // For now, we'll skip deletion
  console.log("Delete from Cloudinary:", publicId);
}
