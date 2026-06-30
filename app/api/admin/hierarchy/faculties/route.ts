import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const faculties = await prisma.faculty.findMany({
      include: {
        _count: {
          select: { departments: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ faculties }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch faculties" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const faculty = await prisma.faculty.create({
      data: { name: name.trim() }
    });

    return NextResponse.json({ faculty }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Faculty name must be unique" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create faculty" }, { status: 500 });
  }
}
