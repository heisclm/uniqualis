import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(sessionToken);
    if (!payload || (payload.role !== "OFFICIAL" && payload.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = payload.sub as string;
    const role = payload.role as string;
    const { id } = await params;
    const body = await req.json();
    const { name, departmentId, criteria, status } = body;

    const idMap = new Map();
    criteria.forEach((c: any) => {
      idMap.set(c.id, crypto.randomUUID());
    });

    // We'll delete existing criteria and recreate them to simplify updates
    const template = await prisma.$transaction(async (tx) => {
      await tx.criterion.deleteMany({
        where: { templateId: id }
      });

      return tx.evaluationTemplate.update({
        where: { id },
        data: {
          name,
          departmentId: departmentId === "ALL" ? null : departmentId,
          status,
          criteria: {
            create: criteria.map((c: any, index: number) => ({
              id: idMap.get(c.id),
              question: c.name,
              type: c.type === "scale" ? "SCALE" : c.type === "multiple_choice" ? "MULTIPLE_CHOICE" : "QUALITATIVE",
              options: c.options || null,
              order: index,
              conditionalOnId: c.conditionalOnId ? idMap.get(c.conditionalOnId) : null,
              conditionalOperator: c.conditionalOperator || null,
              conditionalValue: c.conditionalValue || null,
            }))
          }
        },
        include: {
          criteria: true
        }
      });
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
