import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const ProvisionSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["LECTURER", "OFFICIAL", "ADMIN"]),
  departmentId: z.string().uuid().optional().nullable(),
  facultyId: z.string().uuid().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("uniqualis_session")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Administrator privileges required" }, { status: 403 });
    }

    const body = await req.json();
    const validationResult = ProvisionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { email, role, departmentId, facultyId } = validationResult.data;

    // 1. Check if user already exists in main User table
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // 2. Upsert the provisioned account
    const provisionedAccount = await prisma.provisionedAccount.upsert({
      where: { email },
      update: {
        role,
        departmentId: role === "LECTURER" ? departmentId : null,
        facultyId: role === "OFFICIAL" ? facultyId : null,
        isClaimed: false,
      },
      create: {
        email,
        role,
        departmentId: role === "LECTURER" ? departmentId : null,
        facultyId: role === "OFFICIAL" ? facultyId : null,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Email successfully provisioned",
      provisionedAccount
    });

  } catch (error) {
    console.error("Admin Provisioning Error:", error);
    return NextResponse.json({ error: "Internal server error during provisioning" }, { status: 500 });
  }
}
