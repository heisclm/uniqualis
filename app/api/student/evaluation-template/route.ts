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
    if (!payload || payload.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    let template = null;

    if (departmentId) {
      // Try to find a published template for this department
      template = await prisma.evaluationTemplate.findFirst({
        where: {
          departmentId: departmentId,
          status: "PUBLISHED"
        },
        include: {
          criteria: true
        }
      });
    }

    // Fallback to institution-wide published template
    if (!template) {
      template = await prisma.evaluationTemplate.findFirst({
        where: {
          departmentId: null,
          status: "PUBLISHED"
        },
        include: {
          criteria: true
        }
      });
    }

    // If still no template, create a default one or just return empty
    if (!template) {
      const defaultTemplate = {
        id: "default",
        name: "Default Institutional Evaluation",
        criteria: [
          { id: "t1", type: "SCALE", question: "Teaching Quality" },
          { id: "t2", type: "SCALE", question: "Course Materials" },
          { id: "t3", type: "SCALE", question: "Grading Fairness" },
          { id: "q1", type: "QUALITATIVE", question: "What aspects of this course were most effective?" },
          { id: "q2", type: "QUALITATIVE", question: "How could the lecturer improve the learning experience?" }
        ]
      };
      return NextResponse.json({ template: defaultTemplate }, { status: 200 });
    }

    return NextResponse.json({ template }, { status: 200 });

  } catch (error) {
    console.error("Fetch Template Error:", error);
    return NextResponse.json({ error: "Failed to fetch evaluation template" }, { status: 500 });
  }
}
