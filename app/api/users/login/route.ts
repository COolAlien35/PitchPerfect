import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import dbConnect from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const { email, password } = await req.json();

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, { expiresIn: '2d' });

    return NextResponse.json({ token });
  } catch (err: any) {
    return NextResponse.json({ error: 'Login failed: ' + err.message }, { status: 400 });
  }
}
