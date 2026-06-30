import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'ADMIN') return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    // In a real application, you'd generate a real PDF or CSV here using a library.
    // We will return a mock CSV as a text blob.
    
    const csvContent = `Metric,Value
Total Faculties,${await prisma.faculty.count()}
Total Departments,${await prisma.department.count()}
Total Courses,${await prisma.course.count()}
Total Users,${await prisma.user.count()}
Total Evaluations,${await prisma.evaluation.count()}
`;

    const headers = new Headers();
    headers.set("Content-Type", "text/csv");
    headers.set("Content-Disposition", `attachment; filename="executive-summary-${new Date().toISOString().split('T')[0]}.csv"`);

    return new NextResponse(csvContent, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error("Admin Report Error:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
