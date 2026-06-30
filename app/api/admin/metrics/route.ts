import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload || (payload.role !== "ADMIN" && payload.role !== "OFFICIAL")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalEvaluations = await prisma.evaluation.count();
    const totalDepartments = await prisma.department.count();
    const flaggedReports = await prisma.evaluation.count({
      where: { isFlagged: true }
    });

    const evaluations = await prisma.evaluation.findMany({
      include: {
        course: {
          include: {
            department: true
          }
        }
      }
    });

    const deptStats: Record<string, { totalRating: number; count: number; qualitativeCount: number }> = {};
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    const themeCounts: Record<string, number> = {};

    evaluations.forEach(ev => {
      // Department stats
      const deptName = ev.course.department.name;
      if (!deptStats[deptName]) {
        deptStats[deptName] = { totalRating: 0, count: 0, qualitativeCount: 0 };
      }
      deptStats[deptName].totalRating += ev.ratingQuantitative;
      deptStats[deptName].count += 1;
      if (ev.ratingQualitative) {
        deptStats[deptName].qualitativeCount += 1;
      }

      // AI Sentiment Stats
      if (ev.sentimentScore === "POSITIVE") positiveCount++;
      else if (ev.sentimentScore === "NEUTRAL") neutralCount++;
      else if (ev.sentimentScore === "NEGATIVE") negativeCount++;

      // AI Themes Extraction
      if (ev.themes && Array.isArray(ev.themes)) {
        ev.themes.forEach(theme => {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        });
      }
    });

    const totalAnalyzed = positiveCount + neutralCount + negativeCount;
    const sentimentBreakdown = totalAnalyzed > 0 ? {
      positive: Math.round((positiveCount / totalAnalyzed) * 100),
      neutral: Math.round((neutralCount / totalAnalyzed) * 100),
      negative: Math.round((negativeCount / totalAnalyzed) * 100),
    } : { positive: 0, neutral: 0, negative: 0 };

    const topThemes = Object.entries(themeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const departmentPerformance = Object.keys(deptStats).map(name => {
      const stat = deptStats[name];
      const avgRating = (stat.totalRating / stat.count).toFixed(2);
      const qualPercentage = Math.round((stat.qualitativeCount / stat.count) * 100);
      return {
        name,
        avgRating: parseFloat(avgRating),
        qualPercentage
      };
    });

    return NextResponse.json({
      totalEvaluations,
      totalDepartments,
      flaggedReports,
      departmentPerformance,
      sentimentBreakdown,
      topThemes
    }, { status: 200 });

  } catch (error) {
    console.error("Admin Metrics Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
