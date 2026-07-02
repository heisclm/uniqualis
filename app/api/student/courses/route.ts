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

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { studentLevel: true, studentDepartmentId: true }
    });

    let enrollments = await prisma.studentEnrollment.findMany({
      where: {
        studentId: studentId
      },
      include: {
        course: {
          include: {
            department: true,
            lecturers: {
              include: {
                lecturer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImageUrl: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    // Fetch all evaluations submitted by this student via tokens
    const evaluationTokens = await prisma.evaluationToken.findMany({
      where: { studentId, isUsed: true },
      select: { courseLecturerId: true }
    });

    const systemSetting = await prisma.systemSetting.findFirst();

    // Map through enrollments to determine evaluation status
    const coursesData = enrollments.map(enrollment => {
      const course = enrollment.course;
      
      const lecturersData = course.lecturers.map(cl => {
        // Check if student has evaluated this specific lecturer for this course
        const hasEvaluated = evaluationTokens.some(
          t => t.courseLecturerId === cl.id
        );
        return {
          id: cl.lecturer.id,
          courseLecturerId: cl.id,
          name: `${cl.lecturer.firstName} ${cl.lecturer.lastName}`,
          hasEvaluated
        };
      });

      // A course is fully evaluated if all its lecturers are evaluated
      const isFullyEvaluated = lecturersData.length > 0 && lecturersData.every(l => l.hasEvaluated);

      return {
        id: course.id,
        enrollmentId: enrollment.id,
        code: course.code,
        title: course.title,
        department: course.department.name,
        academicYear: enrollment.academicYear,
        semester: enrollment.semester,
        lecturers: lecturersData,
        status: isFullyEvaluated ? 'COMPLETED' : 'PENDING'
      };
    });

    return NextResponse.json({
      courses: coursesData,
      studentLevel: student?.studentLevel || null,
      systemSetting
    }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch student courses:", error);
    return NextResponse.json({ error: "Failed to fetch student courses" }, { status: 500 });
  }
}
