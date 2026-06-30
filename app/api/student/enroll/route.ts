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
    const { courseId, academicYear, semester } = await req.json();

    if (!courseId || !academicYear || !semester) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const enrollment = await prisma.studentEnrollment.create({
      data: {
        studentId,
        courseId,
        academicYear,
        semester: Number(semester)
      },
      include: {
        course: {
          include: { department: true }
        }
      }
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error: any) {
    console.error("Enrollment Error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "You are already enrolled in this course for this semester." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to enroll in course" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'STUDENT') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const studentId = payload.sub as string;

    const enrollments = await prisma.studentEnrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: { department: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ enrollments }, { status: 200 });
  } catch (error: any) {
    console.error("Enrollment Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'STUDENT') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const studentId = payload.sub as string;
    const url = new URL(req.url);
    const enrollmentId = url.searchParams.get("id");

    if (!enrollmentId) {
      return NextResponse.json({ error: "Enrollment ID required" }, { status: 400 });
    }

    // Security check: ensure student owns this enrollment
    const enrollment = await prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId }
    });

    if (!enrollment || enrollment.studentId !== studentId) {
      return NextResponse.json({ error: "Enrollment not found or unauthorized" }, { status: 403 });
    }

    await prisma.studentEnrollment.delete({
      where: { id: enrollmentId }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Enrollment Delete Error:", error);
    return NextResponse.json({ error: "Failed to remove enrollment" }, { status: 500 });
  }
}
