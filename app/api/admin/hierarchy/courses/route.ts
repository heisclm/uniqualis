import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const courses = await prisma.course.findMany({
      include: {
        department: {
          include: { faculty: true }
        },
        _count: {
          select: { lecturers: true }
        }
      },
      orderBy: [{ code: 'asc' }]
    });

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { code, title, departmentId } = await req.json();
    if (!code || !title || !departmentId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const course = await prisma.course.create({
      data: { 
        code: code.trim().toUpperCase(),
        title: title.trim(),
        departmentId 
      },
      include: { department: true }
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Course code must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
