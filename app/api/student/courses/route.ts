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
      select: { studentLevel: true, studentFacultyId: true }
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

    // Auto-fetch courses if they don't have enrollments but have a level and faculty
    if (enrollments.length === 0 && student?.studentLevel && student?.studentFacultyId) {
      const availableCourses = await prisma.course.findMany({
        where: {
          level: student.studentLevel,
          department: {
            facultyId: student.studentFacultyId
          }
        },
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
      });
      
      // Simulate enrollments for the UI
      enrollments = availableCourses.map(course => ({
        id: `auto-${course.id}`,
        studentId: studentId,
        courseId: course.id,
        course: course,
        academicYear: "2026-2027",
        semester: 1,
        createdAt: new Date()
      })) as any;
    }

    // Fetch all evaluations submitted by this student
    const studentEvaluations = await prisma.evaluation.findMany({
      where: { studentId },
      select: { courseId: true, courseLecturerId: true }
    });

    // Map through enrollments to determine evaluation status
    const coursesData = enrollments.map(enrollment => {
      const course = enrollment.course;
      
      const lecturersData = course.lecturers.map(cl => {
        // Check if student has evaluated this specific lecturer for this course
        const hasEvaluated = studentEvaluations.some(
          e => e.courseId === course.id && e.courseLecturerId === cl.id
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
      studentLevel: student?.studentLevel || null
    }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch student courses:", error);
    return NextResponse.json({ error: "Failed to fetch student courses" }, { status: 500 });
  }
}
