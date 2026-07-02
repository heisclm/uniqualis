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
    const level = parseInt(body.level.toString());

    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student || !student.studentDepartmentId) {
      return NextResponse.json({ error: "Student or department not found" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: { studentLevel: level }
    });

    // Auto-provision enrollments and evaluation tokens for courses in this level/department
    const availableCourses = await prisma.course.findMany({
      where: {
        level: level,
        departmentId: student.studentDepartmentId
      },
      include: {
        lecturers: true
      }
    });

    for (const course of availableCourses) {
      // Upsert enrollment
      await prisma.studentEnrollment.upsert({
        where: {
          studentId_courseId_academicYear_semester: {
            studentId,
            courseId: course.id,
            academicYear: "2026-2027",
            semester: 1
          }
        },
        update: {},
        create: {
          studentId,
          courseId: course.id,
          academicYear: "2026-2027",
          semester: 1
        }
      });

      // Upsert evaluation tokens for lecturers
      for (const cl of course.lecturers) {
        await prisma.evaluationToken.upsert({
          where: {
            studentId_courseLecturerId: {
              studentId,
              courseLecturerId: cl.id
            }
          },
          update: {},
          create: {
            token: `${studentId}-${cl.id}-${Date.now()}`,
            studentId,
            courseLecturerId: cl.id,
            isUsed: false
          }
        });
      }
    }

    return NextResponse.json({ success: true, level: updatedUser.studentLevel }, { status: 200 });
  } catch (error) {
    console.error("Failed to update level:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
