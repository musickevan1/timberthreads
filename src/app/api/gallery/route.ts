import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, writeFile as fsWriteFile } from 'fs/promises';
import path from 'path';
import { ImageAsset, GalleryState } from './types';

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
  await fsWriteFile(DB_PATH, JSON.stringify(data, null, 2));
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

    // Save to public/assets folder
    const filename = file.name.toLowerCase().replace(/\s+/g, '-');
    const filepath = path.join(process.cwd(), 'public', 'assets', filename);
    await writeFile(filepath, buffer);

    // Update database
    const db = await getDB();
    const newImage: ImageAsset = {
      src: `/assets/${filename}`,
      alt: filename.split('.')[0],
      caption,
      section
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
    const data = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'No action specified' },
        { status: 400 }
      );
    }

    const db = await getDB();

    if (action === 'softDelete') {
      const imageToDelete = db.images.find(img => img.src === data.src);
      if (imageToDelete) {
        imageToDelete.isDeleted = true;
        imageToDelete.deletedAt = new Date().toISOString();
        db.deletedImages.push(imageToDelete);
        db.images = db.images.filter(img => img.src !== data.src);
      }
    } else if (action === 'restore') {
      const imageToRestore = db.deletedImages.find(img => img.src === data.src);
      if (imageToRestore) {
        delete imageToRestore.isDeleted;
        delete imageToRestore.deletedAt;
        db.images.push(imageToRestore);
        db.deletedImages = db.deletedImages.filter(img => img.src !== data.src);
      }
    } else if (action === 'updateCaption') {
      const image = db.images.find(img => img.src === data.src);
      if (image) {
        image.caption = data.caption;
      }
    }

    await saveDB(db);

    return NextResponse.json({
      message: 'Operation successful',
      data: db
    });
  } catch (error) {
    console.error('Error updating gallery:', error);
    return NextResponse.json(
      { error: 'Error updating gallery' },
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

    // Remove from deleted images
    db.deletedImages = db.deletedImages.filter(img => img.src !== src);
    await saveDB(db);

    // Don't delete the actual file for now, as it might be used elsewhere
    // Future: Implement reference counting for shared assets

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
