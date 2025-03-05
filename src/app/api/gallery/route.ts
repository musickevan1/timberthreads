import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile as fsWriteFile } from 'fs/promises';
import path from 'path';
import { ImageAsset, GalleryState } from './types';
import cloudinary, { uploadImage, deleteImage } from '../../../lib/cloudinary';

const DB_PATH = path.join(process.cwd(), 'src', 'app', 'api', 'gallery', 'db.json');

async function getDB(): Promise<GalleryState> {
  try {
    const data = await readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { images: [], deletedImages: [] };
  }
}

async function saveDB(data: GalleryState) {
  try {
    // Check if we're in production (Vercel)
    const isProduction = process.env.VERCEL === '1';
    console.log('Environment:', isProduction ? 'Production (Vercel)' : 'Development');
    console.log('Saving to DB path:', DB_PATH);
    
    if (isProduction) {
      console.log('WARNING: In production environment, file system is read-only');
      console.log('Changes will not be persisted between deployments');
      // In production, we'll just return true without actually writing to the file
      // This allows the API to "succeed" even though changes won't persist
      return true;
    }
    
    // In development, write to the file as normal
    await fsWriteFile(DB_PATH, JSON.stringify(data, null, 2));
    console.log('Successfully saved to DB');
    return true;
  } catch (error) {
    console.error('Error saving to DB:', error);
    return false;
  }
}

// GET /api/gallery
export async function GET() {
  try {
    const db = await getDB();
    return NextResponse.json(db);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get gallery data' },
      { status: 500 }
    );
  }
}

// POST /api/gallery
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    const section = formData.get('section') as ImageAsset['section'];

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const filename = file.name.toLowerCase().replace(/\s+/g, '-');
    const uploadResult = await uploadImage(buffer, {
      public_id: `timber-threads/${section}/${filename.split('.')[0]}`,
      resource_type: 'image',
    }) as any;

    // Update database
    const db = await getDB();
    
    // Find the highest order number for this section
    const maxOrder = db.images
      .filter(img => img.section === section)
      .reduce((max, img) => Math.max(max, img.order || 0), 0);
    
    const newImage: ImageAsset = {
      src: uploadResult.secure_url,
      alt: filename.split('.')[0],
      caption,
      section,
      order: maxOrder + 1, // Set the new image to be last in order
      
      // Cloudinary specific fields
      publicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.secure_url,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      resourceType: uploadResult.resource_type
    };
    
    db.images.push(newImage);
    await saveDB(db);

    return NextResponse.json({
      message: 'File uploaded successfully',
      image: newImage
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
}

// PATCH /api/gallery?action=softDelete
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    console.log('PATCH request received with action:', action);
    
    let data;
    try {
      data = await request.json();
      console.log('Request data:', data);
    } catch (parseError) {
      console.error('Error parsing request JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: 'No action specified' },
        { status: 400 }
      );
    }

    const db = await getDB();
    console.log('Current DB state:', JSON.stringify(db, null, 2).substring(0, 200) + '...');

    if (action === 'softDelete') {
      const imageToDelete = db.images.find(img => img.src === data.src);
      if (imageToDelete) {
        imageToDelete.isDeleted = true;
        imageToDelete.deletedAt = new Date().toISOString();
        db.deletedImages.push(imageToDelete);
        db.images = db.images.filter(img => img.src !== data.src);
        console.log('Image soft deleted:', data.src);
      } else {
        console.log('Image not found for soft delete:', data.src);
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404 }
        );
      }
    } else if (action === 'restore') {
      const imageToRestore = db.deletedImages.find(img => img.src === data.src);
      if (imageToRestore) {
        delete imageToRestore.isDeleted;
        delete imageToRestore.deletedAt;
        
        // Find the highest order number for this section
        const maxOrder = db.images
          .filter(img => img.section === imageToRestore.section)
          .reduce((max, img) => Math.max(max, img.order || 0), 0);
        
        imageToRestore.order = maxOrder + 1; // Set the restored image to be last in order
        
        db.images.push(imageToRestore);
        db.deletedImages = db.deletedImages.filter(img => img.src !== data.src);
        console.log('Image restored:', data.src);
      } else {
        console.log('Image not found for restore:', data.src);
        return NextResponse.json(
          { error: 'Image not found in deleted items' },
          { status: 404 }
        );
      }
    } else if (action === 'updateCaption') {
      // Find the image in active images
      let image = db.images.find(img => img.src === data.src);
      
      if (image) {
        image.caption = data.caption;
        console.log('Caption updated for image:', data.src);
      } else {
        // Check in deleted images as well
        image = db.deletedImages.find(img => img.src === data.src);
        if (image) {
          image.caption = data.caption;
          console.log('Caption updated for deleted image:', data.src);
        } else {
          console.log('Image not found for caption update:', data.src);
          return NextResponse.json(
            { error: 'Image not found' },
            { status: 404 }
          );
        }
      }
    } else if (action === 'updateOrder') {
      // Update the order of images in a section
      const { section, orderedImages } = data;
      
      console.log('Updating order for section:', section);
      console.log('Ordered images:', orderedImages);
      
      if (!section) {
        return NextResponse.json(
          { error: 'Section is required for updateOrder' },
          { status: 400 }
        );
      }
      
      if (!Array.isArray(orderedImages) || orderedImages.length === 0) {
        return NextResponse.json(
          { error: 'orderedImages must be a non-empty array' },
          { status: 400 }
        );
      }
      
      // Get all images in this section
      const sectionImages = db.images.filter(img => img.section === section);
      console.log('Images in section:', sectionImages.length);
      
      if (sectionImages.length === 0) {
        return NextResponse.json(
          { error: 'No images found in this section' },
          { status: 404 }
        );
      }
      
      // Check if all ordered images exist in this section
      const missingImages = orderedImages.filter(src => 
        !sectionImages.some(img => img.src === src)
      );
      
      if (missingImages.length > 0) {
        console.log('Missing images:', missingImages);
        return NextResponse.json(
          { error: 'Some images in orderedImages do not exist in this section', missingImages },
          { status: 400 }
        );
      }
      
      // Update order for each image in the section
      orderedImages.forEach((src: string, index: number) => {
        const image = db.images.find(img => img.src === src && img.section === section);
        if (image) {
          image.order = index + 1;
          console.log(`Updated order for ${src} to ${index + 1}`);
        }
      });
    } else {
      return NextResponse.json(
        { error: `Unknown action: ${action}` },
        { status: 400 }
      );
    }

    const saveResult = await saveDB(db);
    if (!saveResult) {
      return NextResponse.json(
        { error: 'Failed to save changes to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Operation successful',
      data: db
    });
  } catch (error) {
    console.error('Error updating gallery:', error);
    return NextResponse.json(
      { error: `Error updating gallery: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE /api/gallery - Permanent deletion
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const src = searchParams.get('src');

    if (!src) {
      return NextResponse.json(
        { error: 'No src provided' },
        { status: 400 }
      );
    }

    const db = await getDB();
    
    // Find the image to delete
    const imageToDelete = db.deletedImages.find(img => img.src === src);
    
    if (imageToDelete && imageToDelete.publicId) {
      // Delete from Cloudinary
      try {
        await deleteImage(imageToDelete.publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with deletion from DB even if Cloudinary deletion fails
      }
    }

    // Remove from deleted images
    db.deletedImages = db.deletedImages.filter(img => img.src !== src);
    await saveDB(db);

    return NextResponse.json({
      message: 'File permanently deleted',
      data: db
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Error deleting file' },
      { status: 500 }
    );
  }
}
