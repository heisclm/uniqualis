import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayload } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const payload = await getPayload(req);
    if (!payload || payload.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.sub as string;

    const evaluations = await prisma.evaluation.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        courseLecturer: {
          include: {
            course: true,
            lecturer: true,
          }
        }
      },
      orderBy: {
        academicDate: 'desc'
      }
    });

    return NextResponse.json({ evaluations }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch student evaluations:", error);
    return NextResponse.json({ error: "Failed to fetch student evaluations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await getPayload(req);
    if (!payload || payload.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.sub as string;
    const body = await req.json();
    const { courseId, courseLecturerId, ratingQuantitative, ratingQualitative } = body;

    if (!courseId || !courseLecturerId || !ratingQuantitative) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure they haven't already evaluated this lecturer for this course
    const existing = await prisma.evaluation.findFirst({
      where: {
        studentId,
        courseId,
        courseLecturerId
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Already evaluated" }, { status: 400 });
    }

    // Determine current semester term based on settings
    const settings = await prisma.systemSetting.findFirst();
    const isFall = (settings?.currentTermName || '').toLowerCase().includes('fall') || new Date().getMonth() > 5;
    
    // Check evaluation window
    if (settings?.evalWindowStartDate && settings?.evalWindowEndDate) {
      const now = new Date();
      if (now < settings.evalWindowStartDate || now > settings.evalWindowEndDate) {
        return NextResponse.json({ error: "Evaluation window is closed" }, { status: 400 });
      }
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        studentId,
        courseId,
        courseLecturerId,
        ratingQuantitative: parseInt(ratingQuantitative),
        ratingQualitative,
        academicDate: new Date(),
        timeSlot: isFall ? 'Fall' : 'Spring',
      }
    });

    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit evaluation:", error);
    return NextResponse.json({ error: "Failed to submit evaluation" }, { status: 500 });
  }
}
