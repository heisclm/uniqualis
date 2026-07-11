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

    // -----------------------------------------------------------------------
    // BASE + SUPPLEMENT MODEL:
    // 1. Fetch the single active CORE template (institution-wide, locked by admin)
    // 2. Fetch the active SUPPLEMENT template for this department (if any)
    // 3. Merge criteria: Core first, then Supplement — seamless for students
    // -----------------------------------------------------------------------

    // Step 1: Find active CORE template
    const coreTemplate = await prisma.evaluationTemplate.findFirst({
      where: {
        templateType: "CORE",
        status: "ACTIVE",
        departmentId: null
      },
      include: {
        criteria: { orderBy: { order: "asc" } }
      },
      orderBy: { createdAt: "desc" }
    });

    // Step 2: Find active SUPPLEMENT for the department
    let supplementTemplate = null;
    if (departmentId) {
      supplementTemplate = await prisma.evaluationTemplate.findFirst({
        where: {
          templateType: "SUPPLEMENT",
          status: "ACTIVE",
          departmentId
        },
        include: {
          criteria: { orderBy: { order: "asc" } }
        },
        orderBy: { createdAt: "desc" }
      });
    }

    // Step 3: Merge if we have a CORE template
    if (coreTemplate) {
      const coreCriteria = coreTemplate.criteria.map((c: any) => ({
        ...c,
        source: "core" // tag so we know origin (not sent to student, internal metadata)
      }));

      const supplementCriteria = supplementTemplate
        ? supplementTemplate.criteria.map((c: any) => ({
            ...c,
            source: "supplement"
          }))
        : [];

      // Re-sequence order: core first (0..n), then supplement (n+1..)
      const mergedCriteria = [
        ...coreCriteria.map((c: any, i: number) => ({ ...c, order: i })),
        ...supplementCriteria.map((c: any, i: number) => ({
          ...c,
          order: coreCriteria.length + i
        }))
      ];

      const mergedTemplate = {
        id: coreTemplate.id,
        name: coreTemplate.name,
        templateType: "MERGED",
        criteria: mergedCriteria,
        // Indicate supplement was attached
        hasSupplementFrom: supplementTemplate ? supplementTemplate.name : null
      };

      return NextResponse.json({ template: mergedTemplate }, { status: 200 });
    }

    // -----------------------------------------------------------------------
    // LEGACY FALLBACK: Standard (non-CORE) templates (backward compatibility)
    // -----------------------------------------------------------------------
    let template = null;

    if (departmentId) {
      template = await prisma.evaluationTemplate.findFirst({
        where: {
          departmentId,
          status: "ACTIVE",
          templateType: "STANDARD"
        },
        include: { criteria: { orderBy: { order: "asc" } } }
      });
    }

    if (!template) {
      template = await prisma.evaluationTemplate.findFirst({
        where: {
          departmentId: null,
          status: "ACTIVE",
          templateType: "STANDARD"
        },
        include: { criteria: { orderBy: { order: "asc" } } }
      });
    }

    // If still nothing found, use the hardcoded default
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
