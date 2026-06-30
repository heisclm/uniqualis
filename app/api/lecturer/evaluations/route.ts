import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

const ANONYMITY_THRESHOLD = 5;

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== "LECTURER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lecturerId = payload.sub as string;
    const courseId = req.nextUrl.searchParams.get("courseId");

    const evaluations = await prisma.evaluation.findMany({
      where: {
        courseLecturer: {
          lecturerId: lecturerId,
          ...(courseId && { courseId })
        }
      },
      include: {
        course: true,
        lecturerResponse: {
          include: {
            attachments: true
          }
        },
        adminComments: {
          include: {
            attachments: true,
            official: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Count evaluations per course to enforce anonymity batch rule
    const courseEvalCounts: Record<string, number> = {};
    evaluations.forEach(ev => {
      courseEvalCounts[ev.courseId] = (courseEvalCounts[ev.courseId] || 0) + 1;
    });

    // Extract unique courses for the filter dropdown unconditionally
    const lecturerCourses = await prisma.courseLecturer.findMany({
      where: { lecturerId: lecturerId },
      include: { course: true }
    });
    
    const uniqueCourses = lecturerCourses.map(lc => ({
      id: lc.course.id,
      title: lc.course.title,
      code: lc.course.code
    }));
    
    // Extract dynamic insights from themes
    const themeCounts: Record<string, number> = {};
    evaluations.forEach(ev => {
      if (ev.themes && Array.isArray(ev.themes)) {
        ev.themes.forEach(theme => {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        });
      }
    });
    
    const sortedThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([theme]) => theme);

    // Simple heuristic: split themes into strengths and improvements just to populate the UI dynamically
    const strengths = sortedThemes.filter((_, i) => i % 2 === 0).slice(0, 3);
    const improvements = sortedThemes.filter((_, i) => i % 2 !== 0).slice(0, 3);
    
    const extractedInsights = {
      strengths: strengths.length > 0 ? strengths : [],
      improvements: improvements.length > 0 ? improvements : []
    };

    // Sanitize output and apply anonymity masking
    const sanitizedEvaluations = evaluations.map(ev => {
      const { studentId, ...rest } = ev;
      
      const isThresholdMet = courseEvalCounts[ev.courseId] >= ANONYMITY_THRESHOLD;
      
      return {
        ...rest,
        isMasked: !isThresholdMet,
        ratingQuantitative: isThresholdMet ? rest.ratingQuantitative : null,
        ratingQualitative: isThresholdMet ? rest.ratingQualitative : null,
        _totalForCourse: courseEvalCounts[ev.courseId] // purely informational for the frontend
      };
    });

    return NextResponse.json({ 
      evaluations: sanitizedEvaluations,
      courses: uniqueCourses,
      extractedInsights
    }, { status: 200 });

  } catch (error) {
    console.error("Fetch Lecturer Evaluations Error:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
  }
}

