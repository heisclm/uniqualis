import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const lecturers = await prisma.user.findMany({
      where: { role: 'LECTURER' },
      include: {
        lecturerDepartment: true,
        coursesTaught: {
          include: { course: true }
        }
      },
      orderBy: { lastName: 'asc' }
    });

    return NextResponse.json({ lecturers }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch lecturers" }, { status: 500 });
  }
}
