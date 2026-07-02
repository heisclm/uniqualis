import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const fetchAll = url.searchParams.get("all") === "true";

    let notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        ...(fetchAll ? {} : { isRead: false }),
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    if (notifications.length === 0) {
      // Check if user has any read notifications, to avoid seeding repeatedly if they cleared them
      const totalNotifications = await prisma.notification.count({
        where: { recipientId: userId }
      });

      if (totalNotifications === 0) {
        // Seed default notifications dynamically based on role
        const role = req.headers.get("x-user-role");
        const defaultNotifs = [
          {
            recipientId: userId,
            title: "Welcome to UniQualis",
            message: "Your account has been successfully configured and is ready for use.",
          },
          {
            recipientId: userId,
            title: "System Update",
            message: "The evaluation portal is currently operating in the active semester mode.",
          }
        ];

        if (role === "STUDENT") {
          defaultNotifs.push({
            recipientId: userId,
            title: "Evaluation Window Open",
            message: "Please ensure you evaluate all your courses before the window closes.",
          });
        } else if (role === "LECTURER") {
          defaultNotifs.push({
            recipientId: userId,
            title: "Course Evaluations Started",
            message: "Students have begun submitting evaluations for your active courses.",
          });
        } else if (role === "OFFICIAL") {
          defaultNotifs.push({
            recipientId: userId,
            title: "Department Overview Ready",
            message: "You can now review the latest performance metrics for your department.",
          });
        }

        await prisma.notification.createMany({
          data: defaultNotifs
        });

        notifications = await prisma.notification.findMany({
          where: {
            recipientId: userId,
            ...(fetchAll ? {} : { isRead: false }),
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        });
      }
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId } = await req.json();

    if (notificationId) {
       await prisma.notification.update({
        where: { id: notificationId, recipientId: userId },
        data: { isRead: true }
      });
    } else {
       await prisma.notification.updateMany({
        where: { recipientId: userId, isRead: false },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
