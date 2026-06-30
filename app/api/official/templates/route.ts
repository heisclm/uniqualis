import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId || (role !== "OFFICIAL" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine the official's scope (department or faculty)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { officialDepartmentId: true, officialFacultyId: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const whereClause = role === "ADMIN" ? {} : {
      OR: [
        { departmentId: null },
        ...(user.officialDepartmentId ? [{ departmentId: user.officialDepartmentId }] : [])
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

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId || (role !== "OFFICIAL" && role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, departmentId, criteria, status } = body;

    if (!name || !criteria || !Array.isArray(criteria)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const template = await prisma.evaluationTemplate.create({
      data: {
        name,
        departmentId: departmentId === "ALL" ? null : departmentId,
        status: status || "DRAFT",
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

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
