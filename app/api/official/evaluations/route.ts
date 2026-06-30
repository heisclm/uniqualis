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

    if (official.officialDepartmentId) {
      departmentIds = [official.officialDepartmentId];
    } else if (official.officialFacultyId) {
      const departments = await prisma.department.findMany({
        where: { facultyId: official.officialFacultyId },
        select: { id: true }
      });
      departmentIds = departments.map(d => d.id);
    } else {
      return NextResponse.json({ error: "Official not assigned to any faculty or department" }, { status: 403 });
    }

    // Now fetch evaluations for courses belonging to these departments
    const evaluations = await prisma.evaluation.findMany({
      where: {
        courseLecturer: {
          course: {
            departmentId: {
              in: departmentIds
            }
          }
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
            course: {
              departmentId: { in: departmentIds }
            }
          }
        }
      }
    });

    const courseAverages = await prisma.evaluation.groupBy({
      by: ['courseId'],
      where: {
        courseLecturer: {
          course: {
            departmentId: { in: departmentIds }
          }
        }
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

    const sanitizedEvaluations = evaluations.map(ev => {
      const { studentId, ...rest } = ev;
      return rest;
    });

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
