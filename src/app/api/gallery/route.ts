import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { ImageAsset, GalleryState } from './types';
import { getGalleryData, saveGalleryData } from '@/lib/redis';
import { cloudinary } from '@/lib/cloudinary';

// Redis operations imported from @/lib/redis
// getGalleryData() replaces getDB()
// saveGalleryData() replaces saveDB()

// GET /api/gallery
export async function GET() {
  try {
    const db = await getGalleryData();
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

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Optimize and resize image
    const optimizedImageBuffer = await sharp(buffer)
      .resize({
        width: 1920,  // Max width for web
        height: 1080, // Max height for web
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 }) // Convert to WebP with 80% quality
      .toBuffer();

    // Upload to Cloudinary
    const base64Image = `data:image/webp;base64,${optimizedImageBuffer.toString('base64')}`;

    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'timber-threads/gallery',
      public_id: `${Date.now()}-${file.name.split('.')[0].toLowerCase().replace(/\s+/g, '-')}`,
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'auto' }
      ],
      tags: [section.toLowerCase(), 'gallery']
    });

    // Update database
    const db = await getGalleryData();

    // Find the highest order number for this section
    const maxOrder = db.images
      .filter(img => img.section === section)
      .reduce((max, img) => Math.max(max, img.order || 0), 0);

    const newImage: ImageAsset = {
      src: uploadResult.public_id,
      alt: file.name.split('.')[0],
      caption,
      section,
      order: maxOrder + 1, // Set the new image to be last in order
      metadata: {
        uploadedAt: new Date().toISOString(),
        dimensions: {
          width: uploadResult.width,
          height: uploadResult.height
        }
      }
    };

    db.images.push(newImage);
    await saveGalleryData(db);

    return NextResponse.json({
      message: 'File uploaded successfully',
      image: newImage
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}` },
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

    const db = await getGalleryData();
    console.log('Current DB state:', JSON.stringify(db, null, 2).substring(0, 200) + '...');

    if (action === 'softDelete') {
      const imageToDelete = db.images.find(img => img.src === data.src);
      if (imageToDelete) {
        // Create a deep copy of the image to avoid reference issues
        const deletedImage = { ...imageToDelete };
        deletedImage.isDeleted = true;
        deletedImage.deletedAt = new Date().toISOString();
        
        // Add to deletedImages
        db.deletedImages.push(deletedImage);
        
        // Remove from images
        db.images = db.images.filter(img => img.src !== data.src);
        
        console.log('Image soft deleted:', data.src);
        
        // Reorder remaining images in the same section
        const remainingImagesInSection = db.images
          .filter(img => img.section === deletedImage.section)
          .sort((a, b) => a.order - b.order);
        
        remainingImagesInSection.forEach((img, index) => {
          img.order = index + 1;
        });
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
        // Create a deep copy of the image
        const restoredImage = { ...imageToRestore };
        
        // Remove deletion metadata
        delete restoredImage.isDeleted;
        delete restoredImage.deletedAt;
        
        // Find the highest order number for this section
        const maxOrder = db.images
          .filter(img => img.section === restoredImage.section)
          .reduce((max, img) => Math.max(max, img.order || 0), 0);
        
        // Set the restored image to be last in order
        restoredImage.order = maxOrder + 1;
        
        // Add back to images
        db.images.push(restoredImage);
        
        // Remove from deletedImages
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
} else if (action === 'updateSection') {
      const { src, newSection } = data;
      
      // Find the image in active images
      const imageIndex = db.images.findIndex(img => img.src === src);
      
      if (imageIndex === -1) {
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404 }
        );
      }
      
      // Get the highest order number for the new section
      const maxOrder = db.images
        .filter(img => img.section === newSection)
        .reduce((max, img) => Math.max(max, img.order || 0), 0);
      
      // Update the image's section and order
      db.images[imageIndex].section = newSection;
      db.images[imageIndex].order = maxOrder + 1;

      await saveGalleryData(db);

      return NextResponse.json({
        message: 'Section updated successfully',
        data: db
      });
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

      // Update order in Redis (persists in all environments)
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

    await saveGalleryData(db);

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

    const db = await getGalleryData();

    // Find the image to delete
    const imageToDelete = db.deletedImages.find(img => img.src === src);

    // Temporarily comment out Cloudinary deletion
    console.log('Would delete from storage:', src);
    // In a real implementation, we would delete the file from storage

    // Remove from deleted images
    db.deletedImages = db.deletedImages.filter(img => img.src !== src);
    await saveGalleryData(db);

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
