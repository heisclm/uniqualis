import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { renderToStream } from "@react-pdf/renderer";
import { OfficialReportPDF } from "@/components/pdf/OfficialReportPDF";
import React from 'react';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(sessionToken);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch data for the report
    const departments = await prisma.department.findMany({
      include: {
        courses: {
          include: {
            evaluations: true,
          }
        }
      }
    });

    const evaluations = await prisma.evaluation.findMany({
      include: {
        course: {
          include: { department: true }
        }
      }
    });

    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let flaggedCount = 0;
    const themeCounts: Record<string, number> = {};

    evaluations.forEach(ev => {
      if (ev.sentimentScore === "POSITIVE") positiveCount++;
      else if (ev.sentimentScore === "NEUTRAL") neutralCount++;
      else if (ev.sentimentScore === "NEGATIVE") negativeCount++;

      if (ev.isFlagged) flaggedCount++;

      if (ev.themes && Array.isArray(ev.themes)) {
        ev.themes.forEach(theme => {
          themeCounts[theme] = (themeCounts[theme] || 0) + 1;
        });
      }
    });

    const topThemes = Object.entries(themeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const departmentStats = departments.map(dept => {
      let totalRating = 0;
      let count = 0;
      let qualCount = 0;

      dept.courses.forEach(course => {
        course.evaluations.forEach(ev => {
          totalRating += ev.ratingQuantitative;
          count++;
          if (ev.ratingQualitative) qualCount++;
        });
      });

      return {
        name: dept.name,
        avgRating: count > 0 ? Number((totalRating / count).toFixed(1)) : 0,
        evalCount: count,
      };
    }).sort((a, b) => b.avgRating - a.avgRating);

    const reportData = {
      totalEvaluations: evaluations.length,
      flaggedCount,
      sentiment: { positive: positiveCount, neutral: neutralCount, negative: negativeCount },
      topThemes,
      departmentStats,
      generatedAt: new Date().toLocaleDateString(),
    };

    // Generate PDF Stream
    const stream = await renderToStream(React.createElement(OfficialReportPDF, { data: reportData }) as any);
    
    // Convert Node.js stream to Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Uniqualis_QA_Report.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      }
    });

  } catch (error) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
