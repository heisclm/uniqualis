import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role") || "STUDENT";
    
    const getFallbackUser = (role: string, id: string) => {
      switch (role) {
        case "LECTURER":
          return { id, firstName: "Jonathan", lastName: "Vance", email: "j.vance@faculty.uniqualis.edu", role, profileImageUrl: null };
        case "ADMIN":
          return { id, firstName: "System", lastName: "Administrator", email: "admin@uniqualis.edu", role, profileImageUrl: null };
        case "OFFICIAL":
          return { id, firstName: "Quality", lastName: "Assurance", email: "qa@uniqualis.edu", role, profileImageUrl: null };
        default:
          return { id, firstName: "Clement", lastName: "Oyekunle", email: "c.oyekunle@student.uniqualis.edu", role, profileImageUrl: null };
      }
    };
    
    if (!userId) {
      // Fallback for development/preview without proper headers
      return NextResponse.json({ user: getFallbackUser(userRole, "USR-00000") });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        profileImageUrl: true,
      }
    });

    if (!user) {
      // Fallback if user not found in DB
      return NextResponse.json({ user: getFallbackUser(userRole, userId) });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
