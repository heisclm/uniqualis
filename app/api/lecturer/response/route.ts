import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== "LECTURER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lecturerId = payload.sub as string;
    const body = await req.json();
    const { evaluationId, content, attachments } = body;

    if (!evaluationId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify evaluation belongs to this lecturer
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        courseLecturer: true
      }
    });

    if (!evaluation || evaluation.courseLecturer.lecturerId !== lecturerId) {
      return NextResponse.json({ error: "Evaluation not found or unauthorized" }, { status: 403 });
    }

    const existingResponse = await prisma.lecturerResponse.findUnique({
      where: { evaluationId }
    });

    if (existingResponse) {
      return NextResponse.json({ error: "You have already responded to this evaluation" }, { status: 409 });
    }

    const response = await prisma.lecturerResponse.create({
      data: {
        evaluationId,
        lecturerId,
        content: content.trim(),
        attachments: attachments && attachments.length > 0 ? {
          create: attachments.map((att: any) => ({
            url: att.url,
            publicId: att.publicId,
            fileName: att.fileName,
            fileType: att.fileType
          }))
        } : undefined
      },
      include: {
        attachments: true
      }
    });

    return NextResponse.json({ success: true, response }, { status: 201 });

  } catch (error) {
    console.error("Submit Lecturer Response Error:", error);
    return NextResponse.json({ error: "Failed to submit response" }, { status: 500 });
  }
}
