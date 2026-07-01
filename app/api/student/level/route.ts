import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'STUDENT') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const studentId = payload.sub as string;
    const body = await req.json();

    if (!body.level) return NextResponse.json({ error: "Level is required" }, { status: 400 });

    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: { studentLevel: parseInt(body.level.toString()) }
    });

    return NextResponse.json({ success: true, level: updatedUser.studentLevel }, { status: 200 });
  } catch (error) {
    console.error("Failed to update level:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
