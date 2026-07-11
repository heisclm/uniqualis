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
      // Admin sees everything — all Core (institution-wide) and all Supplements (dept-scoped)
      const coreTemplates = await prisma.evaluationTemplate.findMany({
        where: { departmentId: null },
        include: { criteria: { orderBy: { order: "asc" } } },
        orderBy: { createdAt: "desc" }
      });

      const supplementTemplates = await prisma.evaluationTemplate.findMany({
        where: { departmentId: { not: null } },
        include: { criteria: { orderBy: { order: "asc" } } },
        orderBy: { createdAt: "desc" }
      });

      // Combined for any legacy usage
      const templates = [...coreTemplates, ...supplementTemplates];

      return NextResponse.json({
        templates,
        coreTemplates,
        supplementTemplates,
        departments,
        userRole: role,
        userDepartmentId: null
      });
    }

    // OFFICIAL: fetch the single active Core template (institution-wide, read-only)
    const coreTemplate = await prisma.evaluationTemplate.findFirst({
      where: { departmentId: null, status: "ACTIVE" },
      include: { criteria: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" }
    });

    // OFFICIAL: fetch their own department's Supplement templates
    const deptCondition: any[] = [];
    if (user?.officialDepartmentId) {
      deptCondition.push({ departmentId: user.officialDepartmentId });
    }
    if (user?.officialFacultyId) {
      // Fetch all department IDs that belong to this faculty
      const facultyDepts = await prisma.department.findMany({
        where: { facultyId: user.officialFacultyId },
        select: { id: true }
      });
      facultyDepts.forEach(d => deptCondition.push({ departmentId: d.id }));
    }

    const supplementTemplates = deptCondition.length > 0
      ? await prisma.evaluationTemplate.findMany({
          where: { OR: deptCondition },
          include: { criteria: { orderBy: { order: "asc" } } },
          orderBy: { createdAt: "desc" }
        })
      : [];

    return NextResponse.json({
      // Backwards-compat combined list
      templates: supplementTemplates,
      coreTemplate: coreTemplate || null,
      supplementTemplates,
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

    const role = payload.role as string;
    const body = await req.json();
    const { name, departmentId, criteria, status } = body;

    if (!name || !criteria || !Array.isArray(criteria)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Officials can ONLY create department-scoped (Supplement) templates
    if (role === "OFFICIAL" && (departmentId === "ALL" || departmentId === null || !departmentId)) {
      return NextResponse.json(
        { error: "Officials can only create Departmental Supplement templates. Institution-wide Core templates are reserved for Admins." },
        { status: 403 }
      );
    }

    // If Admin is activating a new institution-wide (Core) template,
    // auto-archive the previously active Core so only one is active at a time.
    if (role === "ADMIN" && (departmentId === "ALL" || !departmentId) && status === "ACTIVE") {
      await prisma.evaluationTemplate.updateMany({
        where: { departmentId: null, status: "ACTIVE" },
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
        departmentId: departmentId === "ALL" ? null : (departmentId || null),
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
