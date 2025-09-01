import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { db } from '@/src/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { idToken, uid } = await req.json(); // Added uid

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
    }

    const googleResp = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const { email, name, picture, sub: googleId } = googleResp.data;

    const userRef = doc(db, 'users', uid); // Changed to uid
    const userSnap = await getDoc(userRef);

    let user = userSnap.exists() ? userSnap.data() : null;

    if (!user) {
      const newUser = {
        name,
        email,
        googleId,
        photo: picture,
        roles: ['user'],
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, newUser);
      user = newUser;
    } else if (!user.googleId) {
      // Update existing user if googleId is missing, but preserve existing name if set
      const updateData: any = { googleId, photo: picture };
      if (!user.name) {
        updateData.name = name; // Only set name if user doesn't have one
      }
      await setDoc(userRef, updateData, { merge: true });
      user = { ...user, ...updateData };
    }

    const token = jwt.sign({ id: uid, email: user.email }, "9b68f9e05278a077f736cb566186c7437d9afd075e5c8c3170ead132bb4a77e3", { expiresIn: '2d' });

    return NextResponse.json({ token });
  } catch (err: any) {
    console.error("Google Login API Error:", err);
    return NextResponse.json({ error: 'Google Login failed: ' + err.message, details: err.stack }, { status: 400 });
  }
}
