import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayload } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const payload = await getPayload(req);
    if (!payload || payload.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.sub as string;

    const evaluationTokens = await prisma.evaluationToken.findMany({
      where: {
        studentId: studentId,
        isUsed: true
      },
      include: {
        courseLecturer: {
          include: {
            course: true,
            lecturer: true,
          }
        }
      },
      orderBy: {
        usedAt: 'desc'
      }
    });

    // Map to the shape expected by EvaluationHistory
    const evaluations = evaluationTokens.map(token => ({
      id: token.id,
      courseLecturerId: token.courseLecturerId,
      courseLecturer: token.courseLecturer,
      createdAt: token.usedAt || token.createdAt,
      ratingQuantitative: 'Anonymous', // We can't show actual rating due to double-blind
      themes: [] // We can't show themes
    }));

    return NextResponse.json({ evaluations }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch student evaluations:", error);
    return NextResponse.json({ error: "Failed to fetch student evaluations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return NextResponse.json({ error: "Use /api/evaluations" }, { status: 400 });
}
