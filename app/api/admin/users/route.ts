import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/passwords";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Admin Auth
    const token = req.cookies.get('uniqualis_session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // 2. Parse Request
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role, 
      departmentId, 
      facultyId 
    } = await req.json();

    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Only allow creating these roles via this endpoint
    if (!['LECTURER', 'OFFICIAL', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: "Invalid role for this endpoint" }, { status: 400 });
    }

    // 3. Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // 4. Hash password and Create User
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        role,
        // Role-specific relationships
        lecturerDepartmentId: role === 'LECTURER' ? departmentId : null,
        officialFacultyId: role === 'OFFICIAL' ? facultyId : null,
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      } 
    });

  } catch (error) {
    console.error("Admin User Creation Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
