import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayload } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const payload = await getPayload(req);
    if (!payload || payload.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.sub as string;

    const evaluations = await prisma.evaluation.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        courseLecturer: {
          include: {
            course: true,
            lecturer: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ evaluations }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch student evaluations:", error);
    return NextResponse.json({ error: "Failed to fetch student evaluations" }, { status: 500 });
  }
}
