import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const faculties = await prisma.faculty.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ faculties });
  } catch (error) {
    console.error("Error fetching faculties:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
