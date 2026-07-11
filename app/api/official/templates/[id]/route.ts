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

    const role = payload.role as string;
    const { id } = await params;
    const body = await req.json();
    const { name, departmentId, criteria, status } = body;

    // Fetch the existing template to enforce the lock rule
    const existing = await prisma.evaluationTemplate.findUnique({
      where: { id },
      select: { departmentId: true, status: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // CORE = institution-wide (departmentId is null).
    // Officials are strictly prohibited from editing Core templates.
    if (role === "OFFICIAL" && existing.departmentId === null) {
      return NextResponse.json(
        { error: "Core Institutional Templates are locked. Officials cannot edit them." },
        { status: 403 }
      );
    }

    // If Admin is activating a Core template, auto-archive any previously active Core
    if (
      role === "ADMIN" &&
      existing.departmentId === null &&
      status === "ACTIVE" &&
      existing.status !== "ACTIVE"
    ) {
      await prisma.evaluationTemplate.updateMany({
        where: { departmentId: null, status: "ACTIVE", id: { not: id } },
        data: { status: "ARCHIVED" }
      });
    }

    const idMap = new Map();
    criteria.forEach((c: any) => {
      idMap.set(c.id, crypto.randomUUID());
    });

    // Delete existing criteria and recreate to simplify updates
    const template = await prisma.$transaction(async (tx) => {
      await tx.criterion.deleteMany({ where: { templateId: id } });

      return tx.evaluationTemplate.update({
        where: { id },
        data: {
          name,
          // Officials can only change their own dept-scoped templates — preserve the departmentId
          departmentId: role === "ADMIN"
            ? (departmentId === "ALL" ? null : departmentId)
            : existing.departmentId,
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
        include: { criteria: true }
      });
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(sessionToken);
    if (!payload || (payload.role !== "OFFICIAL" && payload.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = payload.role as string;
    const { id } = await params;

    const existing = await prisma.evaluationTemplate.findUnique({
      where: { id },
      select: { departmentId: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Officials cannot delete Core (institution-wide) templates
    if (role === "OFFICIAL" && existing.departmentId === null) {
      return NextResponse.json(
        { error: "Core Institutional Templates cannot be deleted by Officials." },
        { status: 403 }
      );
    }

    await prisma.evaluationTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
