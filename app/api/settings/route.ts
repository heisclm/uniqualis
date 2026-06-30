import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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
        lecturerDepartment: { select: { name: true } },
        officialDepartment: { select: { name: true } },
        studentFaculty: { select: { name: true } },
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
    
    // Strict Payload Stripping: Only extract explicitly allowed fields.
    // Malicious attempts to overwrite studentIdNumber or relationships will be ignored.
    const { 
      notifyWeeklyDigest, notifyLowAverage, notifyEvalWindow, notifySubmissionReceipt,
      firstName, lastName, email, title, officeHours, shortBio
    } = body;

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
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Settings PUT Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
