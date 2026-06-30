import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId || (role !== "OFFICIAL" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, departmentId, criteria, status } = body;

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
              question: c.name,
              type: c.type === "scale" ? "SCALE" : "QUALITATIVE",
              order: index
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
