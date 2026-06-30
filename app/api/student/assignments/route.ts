import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.sub as string;

    // Fetch the courses the student is explicitly enrolled in
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { studentId },
      select: { courseId: true }
    });
    
    const enrolledCourseIds = enrollments.map(e => e.courseId);

    const assignments = await prisma.courseLecturer.findMany({
      where: {
        courseId: { in: enrolledCourseIds }
      },
      include: {
        course: true,
        lecturer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
            lecturerDepartment: true,
          }
        },
        evaluations: {
          where: { studentId }
        }
      }
    });

    return NextResponse.json({ assignments }, { status: 200 });

  } catch (error) {
    console.error("Fetch Assignments Error:", error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}
