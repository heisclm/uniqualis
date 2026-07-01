import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let settings = await prisma.systemSetting.findFirst();
    if (!settings) {
      settings = await prisma.systemSetting.create({ data: {} });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("System settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch system settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    
    let settings = await prisma.systemSetting.findFirst();
    if (!settings) {
      settings = await prisma.systemSetting.create({ data: {} });
    }

    const updated = await prisma.systemSetting.update({
      where: { id: settings.id },
      data: {
        currentTermName: body.currentTermName ?? settings.currentTermName,
        defaultDepartmentView: body.defaultDepartmentView ?? settings.defaultDepartmentView,
        evalWindowStartDate: body.evalWindowStartDate ? new Date(body.evalWindowStartDate) : settings.evalWindowStartDate,
        evalWindowEndDate: body.evalWindowEndDate ? new Date(body.evalWindowEndDate) : settings.evalWindowEndDate,
        autoClosePortal: body.autoClosePortal ?? settings.autoClosePortal,
      }
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("System settings PUT error:", error);
    return NextResponse.json({ error: "Failed to update system settings" }, { status: 500 });
  }
}
