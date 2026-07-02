import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(sessionToken);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        notifyWeeklyDigest: true,
        notifyLowAverage: true,
        notifyEvalWindow: true,
        notifySubmissionReceipt: true,
        title: true,
        officeHours: true,
        shortBio: true,
        studentIdNumber: true,
        profileImageUrl: true,
        lecturerDepartment: { select: { name: true } },
        officialDepartment: { select: { name: true } },
        studentDepartment: { select: { name: true } },
      }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(sessionToken);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    let { 
      notifyWeeklyDigest, notifyLowAverage, notifyEvalWindow, notifySubmissionReceipt,
      firstName, lastName, email, title, officeHours, shortBio, profileImageUrl
    } = body;

    if (profileImageUrl && profileImageUrl.startsWith('data:image')) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(profileImageUrl, {
          folder: 'uniqualis_avatars',
        });
        profileImageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary Upload Error:", uploadError);
        return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.sub as string },
      data: {
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        email: email ?? undefined,
        title: title ?? undefined,
        officeHours: officeHours ?? undefined,
        shortBio: shortBio ?? undefined,
        notifyWeeklyDigest: notifyWeeklyDigest ?? undefined,
        notifyLowAverage: notifyLowAverage ?? undefined,
        notifyEvalWindow: notifyEvalWindow ?? undefined,
        notifySubmissionReceipt: notifySubmissionReceipt ?? undefined,
        profileImageUrl: profileImageUrl ?? undefined,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Settings PUT Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

