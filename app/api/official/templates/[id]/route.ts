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
    const { name, departmentId, criteria, status, templateType } = body;

    // Fetch the existing template to check its type
    const existingTemplate = await prisma.evaluationTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Officials CANNOT edit CORE templates — they are locked
    if (role === "OFFICIAL" && existingTemplate.templateType === "CORE") {
      return NextResponse.json(
        { error: "Core Institutional Templates are locked and cannot be edited by Officials." },
        { status: 403 }
      );
    }

    // Officials CANNOT change a SUPPLEMENT into a CORE or STANDARD
    if (role === "OFFICIAL" && templateType && templateType !== "SUPPLEMENT") {
      return NextResponse.json(
        { error: "Officials can only manage Supplement templates." },
        { status: 403 }
      );
    }

    // If admin is activating a new CORE template, deactivate any previously active CORE
    if (
      role === "ADMIN" &&
      (templateType === "CORE" || existingTemplate.templateType === "CORE") &&
      status === "ACTIVE" &&
      existingTemplate.status !== "ACTIVE"
    ) {
      await prisma.evaluationTemplate.updateMany({
        where: { templateType: "CORE", status: "ACTIVE", id: { not: id } },
        data: { status: "ARCHIVED" }
      });
    }

    const idMap = new Map();
    criteria.forEach((c: any) => {
      idMap.set(c.id, crypto.randomUUID());
    });

    // Delete existing criteria and recreate for simplicity
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
          // Only admins can change templateType; officials keep it as SUPPLEMENT
          templateType: role === "ADMIN" ? (templateType || existingTemplate.templateType) : "SUPPLEMENT",
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

    const existingTemplate = await prisma.evaluationTemplate.findUnique({ where: { id } });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Officials cannot delete CORE templates
    if (role === "OFFICIAL" && existingTemplate.templateType === "CORE") {
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
