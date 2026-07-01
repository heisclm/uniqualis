import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.sub as string;
    
    const body = await req.json();
    const { courseLecturerId } = body;

    if (!courseLecturerId) {
      return NextResponse.json({ error: "courseLecturerId is required" }, { status: 400 });
    }

    // Check if evaluation window is open
    const settings = await prisma.systemSetting.findFirst();
    const today = new Date();
    
    if (settings) {
      if (today < settings.evalWindowStartDate || today > settings.evalWindowEndDate) {
        return NextResponse.json({ error: "The evaluation window is closed." }, { status: 403 });
      }
    }

    // Check if token already exists
    let evalToken = await prisma.evaluationToken.findUnique({
      where: {
        studentId_courseLecturerId: {
          studentId,
          courseLecturerId
        }
      }
    });

    if (!evalToken) {
      // Generate a new secure token
      const rawToken = crypto.randomBytes(32).toString('hex');
      
      evalToken = await prisma.evaluationToken.create({
        data: {
          token: rawToken,
          studentId,
          courseLecturerId
        }
      });
    }

    return NextResponse.json({ token: evalToken.token, isUsed: evalToken.isUsed }, { status: 200 });

  } catch (error) {
    console.error("Token Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate evaluation token" }, { status: 500 });
  }
}
