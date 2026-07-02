import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { hashPassword } from "@/lib/passwords";
import { z } from "zod";

const SignupSchema = z.object({
  accountType: z.enum(["STUDENT", "STAFF"]),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  // Student specifics
  studentIdNumber: z.string().optional(),
  departmentId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = SignupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation failed", details: validationResult.error.format() }, { status: 400 });
    }

    const { accountType, firstName, lastName, email, password, studentIdNumber, departmentId } = validationResult.data;

    // Check for existing user in main table
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    let newUser;
    const passwordHash = await hashPassword(password);

    if (accountType === "STUDENT") {
      if (!studentIdNumber || !departmentId) {
        return NextResponse.json({ error: "Student ID and Department are required for students" }, { status: 400 });
      }

      const existingStudent = await prisma.user.findUnique({ where: { studentIdNumber } });
      if (existingStudent) {
        return NextResponse.json({ error: "Student ID is already registered" }, { status: 409 });
      }

      newUser = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          role: "STUDENT",
          studentIdNumber,
          studentDepartmentId: departmentId,
        }
      });
    } else if (accountType === "STAFF") {
      // Look up ProvisionedAccount
      const provision = await prisma.provisionedAccount.findUnique({
        where: { email }
      });

      if (!provision) {
        return NextResponse.json({ error: "This email has not been provisioned by an administrator. Please contact your QA department." }, { status: 403 });
      }
      
      if (provision.isClaimed) {
        return NextResponse.json({ error: "This provisioned account has already been claimed." }, { status: 409 });
      }

      // Create user based on provision data
      newUser = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          role: provision.role,
          lecturerDepartmentId: provision.role === "LECTURER" ? provision.departmentId : null,
          officialFacultyId: provision.role === "OFFICIAL" ? provision.facultyId : null,
          officialDepartmentId: provision.role === "OFFICIAL" ? provision.departmentId : null,
        }
      });

      // Mark provision as claimed
      await prisma.provisionedAccount.update({
        where: { id: provision.id },
        data: { isClaimed: true }
      });
    } else {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
    }

    // Create JWT
    const token = await signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    const response = NextResponse.json({ success: true, role: newUser.role });
    
    // Set HTTP-only cookie (sameSite: 'none' and secure: true is required for iframes)
    response.cookies.set('uniqualis_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
