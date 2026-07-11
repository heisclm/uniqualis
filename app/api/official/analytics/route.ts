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
    const userId = payload.sub as string;
    const role = payload.role as string;

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "3-years"; // "5-years", "3-years", "1-year"
    
    // Calculate start date based on filter
    const startDate = new Date();
    if (filter === "5-years") startDate.setFullYear(startDate.getFullYear() - 5);
    if (filter === "3-years") startDate.setFullYear(startDate.getFullYear() - 3);
    if (filter === "1-year") startDate.setFullYear(startDate.getFullYear() - 1);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { officialDepartmentId: true, officialFacultyId: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine conditions based on official scope
    const courseCondition: any = {};
    if (user.officialDepartmentId) {
      courseCondition.departmentId = user.officialDepartmentId;
    } else if (user.officialFacultyId) {
      courseCondition.department = {
        facultyId: user.officialFacultyId
      };
    }

    // 1. Dynamic Calculations: Year-Over-Year Trajectory
    const evaluations = await prisma.evaluation.findMany({
      where: {
        academicDate: { gte: startDate },
        course: courseCondition
      },
      include: {
        course: {
          include: { department: true }
        }
      }
    });

    // Group by academic year
    const yearlyMap: Record<string, { totalRating: number; count: number }> = {};
    
    // AI Sentiment Distribution
    const sentimentCounts = {
      POSITIVE: 0,
      NEUTRAL: 0,
      NEGATIVE: 0
    };

    // Department Radar Chart
    const deptScores: Record<string, { total: number; count: number }> = {};

    evaluations.forEach((evalItem) => {
      // Yearly trend
      const year = evalItem.academicDate.getFullYear().toString();
      if (!yearlyMap[year]) {
        yearlyMap[year] = { totalRating: 0, count: 0 };
      }
      yearlyMap[year].totalRating += evalItem.ratingQuantitative;
      yearlyMap[year].count += 1;

      // Sentiment
      if (evalItem.sentimentScore === "POSITIVE") sentimentCounts.POSITIVE++;
      if (evalItem.sentimentScore === "NEUTRAL") sentimentCounts.NEUTRAL++;
      if (evalItem.sentimentScore === "NEGATIVE") sentimentCounts.NEGATIVE++;

      // Department radar
      const deptName = evalItem.course.department.name;
      if (!deptScores[deptName]) {
        deptScores[deptName] = { total: 0, count: 0 };
      }
      deptScores[deptName].total += evalItem.ratingQuantitative;
      deptScores[deptName].count += 1;
    });

    // Format Yearly Data
    const yearlyData = Object.keys(yearlyMap).sort().map((year) => {
      const avgSatisfaction = (yearlyMap[year].totalRating / yearlyMap[year].count);
      return {
        year,
        satisfaction: Number(avgSatisfaction.toFixed(1)),
        // Engagement could be simulated or actual if we query enrollments per year.
        // We'll simulate engagement here based on total evaluations relative to an expected baseline or just scale it.
        engagement: Math.min(100, Math.round(50 + (yearlyMap[year].count * 5))) // Mocked engagement based on count
      };
    });

    // Format Sentiment
    const totalSentiments = sentimentCounts.POSITIVE + sentimentCounts.NEUTRAL + sentimentCounts.NEGATIVE || 1; // avoid division by zero
    const sentimentDistribution = [
      { type: "Positive & Commendations", value: Math.round((sentimentCounts.POSITIVE / totalSentiments) * 100), count: sentimentCounts.POSITIVE, color: "emerald" },
      { type: "Neutral Observations", value: Math.round((sentimentCounts.NEUTRAL / totalSentiments) * 100), count: sentimentCounts.NEUTRAL, color: "slate" },
      { type: "Areas for Improvement", value: Math.round((sentimentCounts.NEGATIVE / totalSentiments) * 100), count: sentimentCounts.NEGATIVE, color: "amber" },
    ];

    // Calculate Semantic Clusters
    const themeCounts: Record<string, number> = {};
    evaluations.forEach(evalItem => {
      if (evalItem.themes && Array.isArray(evalItem.themes)) {
        evalItem.themes.forEach(theme => {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        });
      }
    });
    const semanticClusters = Object.entries(themeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5 clusters

    // Format Radar Data
    const radarData = Object.keys(deptScores).map((dept) => {
      const avg = deptScores[dept].total / deptScores[dept].count;
      return {
        subject: dept,
        A: Math.round((avg / 5) * 100),
        fullMark: 100
      };
    });

    // Real Demographic Data based on used EvaluationTokens and student levels
    const usedTokens = await prisma.evaluationToken.findMany({
      where: {
        isUsed: true,
        usedAt: { gte: startDate },
        courseLecturer: {
          course: courseCondition
        }
      },
      include: {
        student: { select: { studentLevel: true } }
      }
    });

    const termStats: Record<string, { freshmen: number, sophomores: number, juniors: number, seniors: number, total: number }> = {
      "Fall": { freshmen: 0, sophomores: 0, juniors: 0, seniors: 0, total: 0 },
      "Winter": { freshmen: 0, sophomores: 0, juniors: 0, seniors: 0, total: 0 },
      "Spring": { freshmen: 0, sophomores: 0, juniors: 0, seniors: 0, total: 0 }
    };

    usedTokens.forEach(token => {
      const date = token.usedAt || token.createdAt;
      const month = date.getMonth();
      let term = "Spring";
      if (month >= 7 && month <= 11) term = "Fall";
      else if (month >= 0 && month <= 2) term = "Winter";

      termStats[term].total += 1;
      const level = token.student?.studentLevel;
      if (level === 100) termStats[term].freshmen += 1;
      else if (level === 200) termStats[term].sophomores += 1;
      else if (level === 300) termStats[term].juniors += 1;
      else if (level === 400) termStats[term].seniors += 1;
    });

    const demographicData = Object.keys(termStats).map(term => {
      const stats = termStats[term];
      const total = stats.freshmen + stats.sophomores + stats.juniors + stats.seniors;
      if (total === 0) {
        return {
          term,
          freshmen: 0,
          sophomores: 0,
          juniors: 0,
          seniors: 0,
        };
      }
      return {
        term,
        freshmen: Math.round((stats.freshmen / total) * 100),
        sophomores: Math.round((stats.sophomores / total) * 100),
        juniors: Math.round((stats.juniors / total) * 100),
        seniors: Math.round((stats.seniors / total) * 100),
      };
    });

    return NextResponse.json({
      yearlyData,
      sentimentDistribution,
      semanticClusters,
      radarData,
      demographicData,
      totalEvaluations: evaluations.length
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
