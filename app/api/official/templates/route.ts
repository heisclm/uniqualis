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

    // Determine the official's scope (department or faculty)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { officialDepartmentId: true, officialFacultyId: true }
    });

    if (!user && role !== "ADMIN") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const whereClause = role === "ADMIN" ? {} : {
      OR: [
        { departmentId: null },
        ...(user?.officialDepartmentId ? [{ departmentId: user.officialDepartmentId }] : [])
      ]
    };

    const templates = await prisma.evaluationTemplate.findMany({
      where: whereClause,
      include: {
        criteria: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const departments = await prisma.department.findMany({
      select: { id: true, name: true }
    });

    return NextResponse.json({ 
      templates,
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
    const { name, departmentId, criteria, status } = body;

    if (!name || !criteria || !Array.isArray(criteria)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    if (role === "OFFICIAL" && (departmentId === "ALL" || departmentId === null)) {
      return NextResponse.json({ error: "Officials cannot create institution-wide templates" }, { status: 403 });
    }

    const idMap = new Map();
    criteria.forEach((c: any) => {
      idMap.set(c.id, crypto.randomUUID());
    });

    const template = await prisma.evaluationTemplate.create({
      data: {
        name,
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
      include: {
        criteria: true
      }
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
