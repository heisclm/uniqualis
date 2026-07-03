import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    const metrics = {
      totalFaculties: await prisma.faculty.count(),
      totalDepartments: await prisma.department.count(),
      totalCourses: await prisma.course.count(),
      totalUsers: await prisma.user.count(),
      totalEvaluations: await prisma.evaluation.count(),
      activeTemplates: await prisma.evaluationTemplate.count({ where: { status: 'ACTIVE' } }),
    };

    return NextResponse.json(metrics, { status: 200 });
  } catch (error) {
    console.error("Admin Report Error:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
