import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== 'OFFICIAL') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const officialId = payload.sub as string;

    const official = await prisma.user.findUnique({
      where: { id: officialId },
      select: {
        officialFacultyId: true,
        officialDepartmentId: true
      }
    });

    if (!official) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Determine the department IDs the official has access to
    let departmentIds: string[] = [];
    let fetchAll = false;

    if (official.officialDepartmentId) {
      departmentIds = [official.officialDepartmentId];
    } else if (official.officialFacultyId) {
      const departments = await prisma.department.findMany({
        where: { facultyId: official.officialFacultyId },
        select: { id: true }
      });
      departmentIds = departments.map(d => d.id);
    } else {
      // In preview/dev environments, fallback to all departments if not explicitly assigned
      fetchAll = true;
    }

    const courseFilter = fetchAll ? {} : {
      departmentId: { in: departmentIds }
    };

    // Now fetch evaluations for courses belonging to these departments
    const evaluations = await prisma.evaluation.findMany({
      where: {
        courseLecturer: {
          course: courseFilter
        }
      },
      include: {
        courseLecturer: {
          include: {
            course: true,
            lecturer: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        responses: {
          include: { criterion: true }
        },
        lecturerResponse: {
          include: { attachments: true }
        },
        adminComments: {
          include: {
            official: { select: { firstName: true, lastName: true } },
            attachments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { isFlagged: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Aggregations
    const pendingQAPlansCount = await prisma.lecturerResponse.count({
      where: {
        status: "PENDING_REVIEW",
        evaluation: {
          courseLecturer: {
            course: courseFilter
          }
        }
      }
    });

    // Fix: Prisma groupBy doesn't support nested relation filtering well in all versions
    const courses = await prisma.course.findMany({
      where: courseFilter,
      select: { id: true }
    });
    const courseIds = courses.map(c => c.id);

    const courseAverages = await prisma.evaluation.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: courseIds }
      },
      _avg: {
        ratingQuantitative: true
      },
      having: {
        ratingQuantitative: {
          _avg: {
            lt: 3.0
          }
        }
      }
    });
    
    const atRiskCoursesCount = courseAverages.length;

    const sanitizedEvaluations = evaluations;

    return NextResponse.json({ 
      evaluations: sanitizedEvaluations, 
      pendingQAPlansCount, 
      atRiskCoursesCount 
    }, { status: 200 });

  } catch (error) {
    console.error("Official fetch evaluations error:", error);
    return NextResponse.json({ error: "Failed to fetch evaluations" }, { status: 500 });
  }
}
