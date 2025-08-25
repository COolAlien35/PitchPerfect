import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/src/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    console.log("Received token in Profile API:", token); // Added for debugging

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
    }

    const decoded = jwt.verify(token, "9b68f9e05278a077f736cb566186c7437d9afd075e5c8c3170ead132bb4a77e3") as { id: string };
    
    // In Firestore, the user ID from Firebase Auth is typically used as the document ID
    const userRef = doc(db, 'users', decoded.id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userSnap.data();

    return NextResponse.json(user);
  } catch (err: any) {
    console.error("Profile API Error:", err);
    return NextResponse.json({ error: 'Failed to fetch profile: ' + err.message, details: err.stack }, { status: 400 });
  }
}
