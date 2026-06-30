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
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const faculty = await prisma.faculty.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error("Error updating faculty:", error);
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
    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        departments: { select: { id: true } }
      }
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    if (faculty.departments.length > 0) {
      return NextResponse.json({ error: "Cannot delete faculty with existing departments. Please remove or reassign departments first." }, { status: 400 });
    }

    await prisma.faculty.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting faculty:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
