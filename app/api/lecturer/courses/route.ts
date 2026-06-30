import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId || role !== "LECTURER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const activeCourses = courseLecturers.map((cl) => {
      const totalStudents = cl.course.enrollments.length;
      const submittedEvaluations = cl.evaluations.length;
      const completionRate = totalStudents > 0 
        ? Math.round((submittedEvaluations / totalStudents) * 100) 
        : 0;

      return {
        id: cl.course.id,
        code: cl.course.code,
        title: cl.course.title,
        status: "ACTIVE", // For simplicity, mark all as ACTIVE or derive from somewhere
        studentsEnrolled: totalStudents,
        evaluationsSubmitted: submittedEvaluations,
        completionRate: completionRate,
        nextEvaluationDate: "Upcoming Window", 
        department: cl.course.departmentId,
        term: "Current Term", 
      };
    });

    // We can filter by ACTIVE vs COMPLETED based on status or date if schema has it, 
    // for now we'll divide them manually or just pass all. Let's pass all as one array and let frontend filter if needed.
    return NextResponse.json({ courses: activeCourses });

  } catch (error) {
    console.error("Error fetching lecturer courses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
