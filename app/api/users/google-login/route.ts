import dbConnect from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { idToken } = await req.json();

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
    }

    const googleResp = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const { email, name, picture, sub: googleId } = googleResp.data;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        photo: picture,
        roles: ['user'],
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.photo = picture;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, { expiresIn: '2d' });

    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json({ error: 'Google Login failed: ' + err.message }, { status: 400 });
  }
}
