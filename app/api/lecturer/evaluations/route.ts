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

    const evaluations = await prisma.evaluation.findMany({
      where: {
        courseLecturer: {
          lecturerId: lecturerId
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

    return NextResponse.json({ evaluations: sanitizedEvaluations }, { status: 200 });

  } catch (error) {
    console.error("Fetch Lecturer Evaluations Error:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
  }
}

