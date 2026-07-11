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

    // ─────────────────────────────────────────────────────────────────────────
    // BASE + SUPPLEMENT MODEL
    //
    // Core template   = institution-wide (departmentId IS NULL), ACTIVE
    //                   Created by Admin — the locked KPI baseline.
    // Supplement      = department-scoped (departmentId = student's dept), ACTIVE
    //                   Created by the Official — departmental add-on questions.
    //
    // The system merges them: Core criteria first, then Supplement criteria.
    // This produces a single seamless form for the student.
    // ─────────────────────────────────────────────────────────────────────────

    // Step 1: Find the active Core template (institution-wide)
    const coreTemplate = await prisma.evaluationTemplate.findFirst({
      where: { departmentId: null, status: "ACTIVE" },
      include: { criteria: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" }
    });

    // Step 2: Find the active Supplement for this specific department
    let supplementTemplate = null;
    if (departmentId) {
      supplementTemplate = await prisma.evaluationTemplate.findFirst({
        where: { departmentId, status: "ACTIVE" },
        include: { criteria: { orderBy: { order: "asc" } } },
        orderBy: { createdAt: "desc" }
      });
    }

    // Step 3: If a Core exists, merge Core + Supplement into one seamless template
    if (coreTemplate) {
      const coreCriteria = coreTemplate.criteria.map((c: any, i: number) => ({
        ...c,
        order: i,
        _source: "core"
      }));

      const suppCriteria = (supplementTemplate?.criteria ?? []).map((c: any, i: number) => ({
        ...c,
        order: coreCriteria.length + i,
        _source: "supplement"
      }));

      const merged = {
        id: coreTemplate.id,
        name: coreTemplate.name,
        criteria: [...coreCriteria, ...suppCriteria]
      };

      return NextResponse.json({ template: merged }, { status: 200 });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LEGACY FALLBACK (no Core template exists yet)
    // Try department-specific first, then institution-wide, then built-in default.
    // ─────────────────────────────────────────────────────────────────────────
    let template = null;

    if (departmentId) {
      template = await prisma.evaluationTemplate.findFirst({
        where: { departmentId, status: "ACTIVE" },
        include: { criteria: { orderBy: { order: "asc" } } }
      });
    }

    if (!template) {
      template = await prisma.evaluationTemplate.findFirst({
        where: { departmentId: null, status: "ACTIVE" },
        include: { criteria: { orderBy: { order: "asc" } } }
      });
    }

    if (!template) {
      // Built-in default so students always have something to evaluate with
      return NextResponse.json({
        template: {
          id: "default",
          name: "Default Institutional Evaluation",
          criteria: [
            { id: "t1", type: "SCALE", question: "Teaching Quality" },
            { id: "t2", type: "SCALE", question: "Course Materials" },
            { id: "t3", type: "SCALE", question: "Grading Fairness" },
            { id: "q1", type: "QUALITATIVE", question: "What aspects of this course were most effective?" },
            { id: "q2", type: "QUALITATIVE", question: "How could the lecturer improve the learning experience?" }
          ]
        }
      }, { status: 200 });
    }

    return NextResponse.json({ template }, { status: 200 });

  } catch (error) {
    console.error("Fetch Template Error:", error);
    return NextResponse.json({ error: "Failed to fetch evaluation template" }, { status: 500 });
  }
}
