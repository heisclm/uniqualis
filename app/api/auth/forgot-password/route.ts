import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if not found to prevent email enumeration
      return NextResponse.json({ success: true, message: "If an account exists, a reset code has been sent." }, { status: 200 });
    }

    // Generate a secure 6-digit code
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedToken = await bcrypt.hash(token, 10);

    // Store in DB, expire in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    });

    await prisma.passwordResetToken.create({
      data: {
        email,
        token: hashedToken,
        expiresAt
      }
    });

    // In a real app, send email here. For now, log it.
    console.log(`\n\n=========================================`);
    console.log(`PASSWORD RESET CODE FOR ${email}: ${token}`);
    console.log(`=========================================\n\n`);

    return NextResponse.json({ 
      success: true, 
      message: "If an account exists, a reset code has been sent."
    }, { status: 200 });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
