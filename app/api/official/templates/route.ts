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
      select: { id: true, name: true, facultyId: true }
    });

    if (role === "ADMIN") {
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

      return NextResponse.json({
        templates: [...coreTemplates, ...supplementTemplates],
        coreTemplates,
        supplementTemplates,
        departments,
        userRole: role,
        userDepartmentId: null,
        userDepartmentIds: []
      });
    }

    // ── Resolve which department(s) this Official manages ──────────────────
    // Case A: Official is assigned directly to a department
    // Case B: Official is assigned to a faculty (dean-level) — they manage all depts in that faculty
    let officialDeptIds: string[] = [];

    if (user?.officialDepartmentId) {
      officialDeptIds = [user.officialDepartmentId];
    } else if (user?.officialFacultyId) {
      officialDeptIds = departments
        .filter(d => d.facultyId === user.officialFacultyId)
        .map(d => d.id);
    }

    // Primary dept for auto-selection in the UI (first in list)
    const primaryDeptId = officialDeptIds[0] || null;

    // OFFICIAL: fetch the single active Core template (institution-wide, read-only)
    const coreTemplate = await prisma.evaluationTemplate.findFirst({
      where: { departmentId: null, status: "ACTIVE" },
      include: { criteria: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" }
    });

    // OFFICIAL: fetch their Supplement templates (any of their managed departments)
    const supplementTemplates = officialDeptIds.length > 0
      ? await prisma.evaluationTemplate.findMany({
          where: { departmentId: { in: officialDeptIds } },
          include: { criteria: { orderBy: { order: "asc" } } },
          orderBy: { createdAt: "desc" }
        })
      : [];

    return NextResponse.json({
      templates: supplementTemplates,
      coreTemplate: coreTemplate || null,
      supplementTemplates,
      departments,
      userRole: role,
      // Primary department for auto-selection
      userDepartmentId: primaryDeptId,
      // Full list so the dropdown shows all managed departments
      userDepartmentIds: officialDeptIds
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
    const { name, departmentId, criteria, status } = body;

    if (!name || !criteria || !Array.isArray(criteria)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    if (role === "OFFICIAL") {
      // Officials can NEVER create institution-wide (Core) templates
      if (!departmentId || departmentId === "ALL") {
        return NextResponse.json(
          { error: "Officials must select a department for their Supplement template." },
          { status: 403 }
        );
      }

      // Verify the official actually manages this department (server-side check)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { officialDepartmentId: true, officialFacultyId: true }
      });

      let officialDeptIds: string[] = [];
      if (user?.officialDepartmentId) {
        officialDeptIds = [user.officialDepartmentId];
      } else if (user?.officialFacultyId) {
        const facultyDepts = await prisma.department.findMany({
          where: { facultyId: user.officialFacultyId },
          select: { id: true }
        });
        officialDeptIds = facultyDepts.map(d => d.id);
      }

      // If we couldn't resolve any dept for this official, use the first available
      // (fallback for officials whose dept assignment may not be set correctly)
      if (officialDeptIds.length === 0) {
        return NextResponse.json(
          { error: "Your account has no department assigned. Please contact an Admin." },
          { status: 403 }
        );
      }

      // Ensure the claimed departmentId is one the official actually manages
      if (!officialDeptIds.includes(departmentId)) {
        return NextResponse.json(
          { error: "You can only create templates for your assigned department(s)." },
          { status: 403 }
        );
      }
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

