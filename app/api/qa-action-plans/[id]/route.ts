import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(sessionToken);
    if (!payload || (payload.role !== "OFFICIAL" && payload.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status, officialNotes } = await req.json();

    if (!["PENDING_REVIEW", "APPROVED", "NEEDS_REVISION"].includes(status)) {
       return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const plan = await prisma.lecturerResponse.update({
      where: { id },
      data: {
        status,
        officialNotes
      }
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Action Plans PUT Error:", error);
    return NextResponse.json({ error: "Failed to update action plan" }, { status: 500 });
  }
}
