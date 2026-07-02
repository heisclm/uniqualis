import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'STUDENT') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const studentId = payload.sub as string;

    // Get student's department
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { studentDepartmentId: true }
    });

    if (!student?.studentDepartmentId) {
      return NextResponse.json({ error: "Student is not assigned to a department." }, { status: 400 });
    }

    const availableCourses = await prisma.course.findMany({
      where: {
        departmentId: student.studentDepartmentId
      },
      include: {
        department: true
      },
      orderBy: { code: 'asc' }
    });

    return NextResponse.json({ availableCourses }, { status: 200 });
  } catch (error) {
    console.error("Fetch Available Courses Error:", error);
    return NextResponse.json({ error: "Failed to fetch available courses" }, { status: 500 });
  }
}
