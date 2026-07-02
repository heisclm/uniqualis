import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'OFFICIAL') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const officialId = payload.sub as string;
    
    const { evaluationId, content, isCommendation, attachments } = await req.json();

    if (!evaluationId || !content) {
      return NextResponse.json({ error: "Evaluation ID and content are required." }, { status: 400 });
    }

    // Verify official has access to this evaluation
    const official = await prisma.user.findUnique({
      where: { id: officialId },
      select: {
        officialFacultyId: true,
        officialDepartmentId: true
      }
    });

    if (!official) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        courseLecturer: {
          include: {
            course: {
              select: { departmentId: true, department: { select: { facultyId: true } } }
            }
          }
        }
      }
    });

    if (!evaluation) return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });

    const courseDepartmentId = evaluation.courseLecturer.course.departmentId;
    const courseFacultyId = evaluation.courseLecturer.course.department.facultyId;

    const hasAccess = 
      (official.officialDepartmentId && official.officialDepartmentId === courseDepartmentId) ||
      (official.officialFacultyId && official.officialFacultyId === courseFacultyId) ||
      (!official.officialDepartmentId && !official.officialFacultyId); // Allow access for unassigned preview officials

    if (!hasAccess) {
      return NextResponse.json({ error: "You do not have permission to comment on this evaluation." }, { status: 403 });
    }

    // Create the comment
    const comment = await prisma.administrativeComment.create({
      data: {
        evaluationId,
        officialId,
        content,
        isCommendation: Boolean(isCommendation),
        attachments: {
          create: attachments?.map((att: any) => ({
            url: att.url,
            publicId: att.publicId,
            fileName: att.fileName,
            fileType: att.fileType
          })) || []
        }
      }
    });

    return NextResponse.json({ success: true, comment }, { status: 201 });

  } catch (error) {
    console.error("Failed to create administrative comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
