import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    let userId = req.headers.get("x-user-id");
    let userRole = req.headers.get("x-user-role");

    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    
    if (sessionToken) {
        try {
            const payload = await verifyToken(sessionToken);
            if (payload) {
                userId = payload.sub as string;
                userRole = payload.role as string;
            }
        } catch(e) {}
    }
    
    userRole = userRole || "STUDENT";
    
    const getFallbackUser = (role: string, id: string) => {
      switch (role) {
        case "LECTURER":
          return { id, firstName: "Jonathan", lastName: "Vance", email: "j.vance@faculty.uniqualis.edu", role, profileImageUrl: null };
        case "ADMIN":
          return { id, firstName: "System", lastName: "Admin", email: "admin@uniqualis.edu", role, profileImageUrl: null };
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
