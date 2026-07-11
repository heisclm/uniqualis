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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { officialDepartmentId: true, officialFacultyId: true }
    });

    if (!user && role !== "ADMIN") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const departments = await prisma.department.findMany({
      select: { id: true, name: true }
    });

    if (role === "ADMIN") {
      // Admin sees all templates grouped by type
      const allTemplates = await prisma.evaluationTemplate.findMany({
        include: { criteria: { orderBy: { order: "asc" } } },
        orderBy: { createdAt: "desc" }
      });

      return NextResponse.json({
        templates: allTemplates,
        departments,
        userRole: role,
        userDepartmentId: null
      });
    }

    // OFFICIAL: fetch the single active CORE template (institution-wide, locked)
    const coreTemplate = await prisma.evaluationTemplate.findFirst({
      where: {
        templateType: "CORE",
        status: "ACTIVE",
        departmentId: null
      },
      include: { criteria: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" }
    });

    // OFFICIAL: fetch their own department's SUPPLEMENT templates
    const supplementCondition: any = { templateType: "SUPPLEMENT" };
    if (user?.officialDepartmentId) {
      supplementCondition.departmentId = user.officialDepartmentId;
    } else if (user?.officialFacultyId) {
      supplementCondition.department = { facultyId: user.officialFacultyId };
    }

    const supplementTemplates = await prisma.evaluationTemplate.findMany({
      where: supplementCondition,
      include: { criteria: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" }
    });

    // Also fetch legacy STANDARD templates scoped to this official
    const standardCondition: any = {
      templateType: "STANDARD",
      OR: [
        { departmentId: null },
        ...(user?.officialDepartmentId ? [{ departmentId: user.officialDepartmentId }] : [])
      ]
    };

    const standardTemplates = await prisma.evaluationTemplate.findMany({
      where: standardCondition,
      include: { criteria: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      coreTemplate: coreTemplate || null,
      supplementTemplates,
      standardTemplates,
      // Combined for backwards compat
      templates: [...supplementTemplates, ...standardTemplates],
      departments,
      userRole: role,
      userDepartmentId: user?.officialDepartmentId || null
    });

  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(sessionToken);
    if (!payload || (payload.role !== "OFFICIAL" && payload.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = payload.sub as string;
    const role = payload.role as string;
    const body = await req.json();
    const { name, departmentId, criteria, status, templateType } = body;

    if (!name || !criteria || !Array.isArray(criteria)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Determine the actual templateType to save
    let resolvedType = "STANDARD";

    if (role === "ADMIN") {
      // Admin can create CORE or STANDARD
      resolvedType = templateType === "CORE" ? "CORE" : "STANDARD";
    } else if (role === "OFFICIAL") {
      // Officials can ONLY create SUPPLEMENT templates scoped to their department
      resolvedType = "SUPPLEMENT";

      // Block institution-wide creation
      if (departmentId === "ALL" || departmentId === null) {
        return NextResponse.json(
          { error: "Officials can only create Departmental Supplement templates. Institution-wide templates are reserved for Admins." },
          { status: 403 }
        );
      }
    }

    // If admin creates a new CORE template, deactivate any previously active CORE template
    if (role === "ADMIN" && resolvedType === "CORE" && status === "ACTIVE") {
      await prisma.evaluationTemplate.updateMany({
        where: { templateType: "CORE", status: "ACTIVE" },
        data: { status: "ARCHIVED" }
      });
    }

    const idMap = new Map();
    criteria.forEach((c: any) => {
      idMap.set(c.id, crypto.randomUUID());
    });

    const template = await prisma.evaluationTemplate.create({
      data: {
        name,
        templateType: resolvedType,
        departmentId: departmentId === "ALL" ? null : departmentId,
        status: status || "DRAFT",
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

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
