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

    const lecturerId = payload.sub as string;

    // Get total evaluations
    const totalEvaluations = await prisma.evaluation.count({
      where: {
        courseLecturer: {
          lecturerId
        }
      }
    });

    // Get average rating
    const averageRatingResult = await prisma.evaluation.aggregate({
      where: {
        courseLecturer: {
          lecturerId
        }
      },
      _avg: {
        ratingQuantitative: true
      }
    });

    const averageRating = averageRatingResult._avg.ratingQuantitative 
      ? averageRatingResult._avg.ratingQuantitative.toFixed(1) 
      : "0.0";

    // Get pending responses count (evaluations with qualitative rating but no response)
    const pendingResponses = await prisma.evaluation.count({
      where: {
        courseLecturer: {
          lecturerId
        },
        ratingQualitative: { not: null },
        lecturerResponse: null
      }
    });

    // Get recent evaluations for Actionable Feedback Feed
    // Exclude studentId strictly for anonymity
    const recentFeedback = await prisma.evaluation.findMany({
      where: { 
        courseLecturer: { lecturerId },
        ratingQualitative: { not: null }
      },
      select: {
        id: true,
        sentimentScore: true,
        themes: true,
        ratingQualitative: true,
        createdAt: true,
        isFlagged: true,
        course: { select: { title: true, code: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const systemSetting = await prisma.systemSetting.findFirst();
    const activeTerm = systemSetting?.currentTermName || "Current Term";
    let isEvalWindowActive = false;
    if (systemSetting?.evalWindowStartDate && systemSetting?.evalWindowEndDate) {
      const now = new Date();
      if (now >= new Date(systemSetting.evalWindowStartDate) && now <= new Date(systemSetting.evalWindowEndDate)) {
        isEvalWindowActive = true;
      }
    }

    return NextResponse.json({
      averageRating,
      totalEvaluations,
      pendingResponses,
      recentFeedback,
      activeTerm,
      isEvalWindowActive
    });
  } catch (error) {
    console.error("Lecturer dashboard GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
