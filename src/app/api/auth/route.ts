import { NextRequest, NextResponse } from 'next/server';

// Authentication API endpoint for secure server-side password verification
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Check if the password matches the environment variable
    // Note: The environment variable should NOT have the NEXT_PUBLIC_ prefix
    const isValid = password === process.env.ADMIN_PASSWORD;
    
    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}
