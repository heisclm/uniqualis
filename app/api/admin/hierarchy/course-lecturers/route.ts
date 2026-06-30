import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { courseId, lecturerId } = await req.json();
    if (!courseId || !lecturerId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const assignment = await prisma.courseLecturer.create({
      data: { courseId, lecturerId }
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Lecturer is already assigned to this course" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to assign lecturer to course" }, { status: 500 });
  }
}
