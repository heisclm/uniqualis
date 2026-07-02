import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== "LECTURER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = payload.sub as string;
    const role = payload.role as string;


    const systemSetting = await prisma.systemSetting.findFirst();
    const now = new Date();
    
    let windowStatus = "Inactive";
    if (systemSetting) {
      if (now >= systemSetting.evalWindowStartDate && now <= systemSetting.evalWindowEndDate) {
        windowStatus = "ACTIVE";
      } else if (now > systemSetting.evalWindowEndDate) {
        windowStatus = "Archived";
      }
    }

    const courseLecturers = await prisma.courseLecturer.findMany({
      where: {
        lecturerId: userId,
      },
      include: {
        course: {
          include: {
            enrollments: true,
          }
        },
        evaluations: true,
      }
    });

    const activeCourses = courseLecturers.map((cl) => {
      const totalStudents = cl.course.enrollments.length;
      
      // Filter evaluations just for this specific lecturer in this course
      const myEvaluations = cl.evaluations.filter(e => e.courseLecturerId === cl.id);
      const submittedEvaluations = myEvaluations.length;
      
      const completionRate = totalStudents > 0 
        ? Math.round((submittedEvaluations / totalStudents) * 100) 
        : 0;

      // Determine term from enrollments if available, else fallback
      const academicYear = cl.course.enrollments[0]?.academicYear || systemSetting?.currentTermName || "Current Term";
      
      return {
        id: cl.course.id,
        code: cl.course.code,
        title: cl.course.title,
        status: windowStatus, 
        studentsEnrolled: totalStudents,
        evaluationsSubmitted: submittedEvaluations,
        completionRate: completionRate,
        nextEvaluationDate: systemSetting?.evalWindowStartDate.toISOString() || "Upcoming Window", 
        department: cl.course.departmentId,
        term: academicYear, 
      };
    });

    return NextResponse.json({ courses: activeCourses });

  } catch (error) {
    console.error("Error fetching lecturer courses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
