import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(sessionToken);
    if (!payload || (payload.role !== "OFFICIAL" && payload.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const plans = await prisma.lecturerResponse.findMany({
      include: {
        lecturer: {
          select: { firstName: true, lastName: true }
        },
        evaluation: {
          include: {
            course: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedPlans = plans.map(p => ({
      id: p.id,
      lecturerName: `${p.lecturer.firstName} ${p.lecturer.lastName}`,
      course: `${p.evaluation.course.code} - ${p.evaluation.course.title}`,
      term: "Current Term", // Could be derived from evaluation.academicDate
      submittedAt: p.createdAt,
      status: p.status, // "PENDING_REVIEW", "APPROVED", "NEEDS_REVISION"
      originalFeedbackSummary: p.evaluation.themes.join(", ") || "General Feedback",
      actionPlanText: p.content,
      officialNotes: p.officialNotes,
    }));

    return NextResponse.json(formattedPlans);
  } catch (error) {
    console.error("Action Plans GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch action plans" }, { status: 500 });
  }
}
