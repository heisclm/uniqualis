import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const departments = await prisma.department.findMany({
      include: {
        faculty: true,
        _count: {
          select: { courses: true, lecturers: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ departments }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name, facultyId } = await req.json();
    if (!name || !facultyId) return NextResponse.json({ error: "Name and facultyId are required" }, { status: 400 });

    const department = await prisma.department.create({
      data: { 
        name: name.trim(),
        facultyId 
      },
      include: { faculty: true }
    });

    return NextResponse.json({ department }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Department name must be unique within a faculty" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
