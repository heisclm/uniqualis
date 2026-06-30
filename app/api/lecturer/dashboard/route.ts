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

    // Get recent notifications / activity (Mocked for now since notifications aren't fully wired)
    const recentActivity = await prisma.notification.findMany({
      where: { recipientId: lecturerId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      averageRating,
      totalEvaluations,
      pendingResponses,
      recentActivity
    });
  } catch (error) {
    console.error("Lecturer dashboard GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
