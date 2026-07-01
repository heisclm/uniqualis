import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, token, newPassword } = await req.json();

    if (!email || !token || !newPassword) {
      return NextResponse.json({ error: "Email, reset code, and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    // Verify token
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        email
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    });

    if (resetTokens.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 });
    }

    const resetTokenRecord = resetTokens[0];
    
    // Check if token matches hash
    const isValid = await bcrypt.compare(token, resetTokenRecord.token);
    
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired reset code" }, { status: 400 });
    }

    if (resetTokenRecord.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } });
      return NextResponse.json({ error: "Reset code has expired. Please request a new one." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetTokenRecord.id }
      })
    ]);

    return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
