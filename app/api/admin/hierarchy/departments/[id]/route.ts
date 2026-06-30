import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const { name, facultyId } = await req.json();

    if (!name || !facultyId) {
      return NextResponse.json({ error: "Name and Faculty ID are required" }, { status: 400 });
    }

    const department = await prisma.department.update({
      where: { id },
      data: { name, facultyId },
    });

    return NextResponse.json({ department });
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    // Check for dependencies
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        courses: { select: { id: true } },
        evaluationTemplates: { select: { id: true } }
      }
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    if (department.courses.length > 0) {
      return NextResponse.json({ error: "Cannot delete department with existing courses. Please remove or reassign courses first." }, { status: 400 });
    }

    if (department.evaluationTemplates.length > 0) {
      return NextResponse.json({ error: "Cannot delete department with existing evaluation templates. Please remove them first." }, { status: 400 });
    }

    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
