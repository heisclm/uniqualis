import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { triggerEvaluationAnalysis } from "@/lib/ai";
import { sendQANotificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('uniqualis_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload || payload.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentId = payload.sub as string;
    
    // Data Sanitization & Extraction
    const body = await req.json();
    const { courseLecturerId, ratingQuantitative, ratingQualitative, themes } = body;

    if (!courseLecturerId || typeof ratingQuantitative !== 'number') {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (ratingQuantitative < 1 || ratingQuantitative > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    // Sanitize qualitative feedback (basic HTML escape)
    const sanitizedFeedback = ratingQualitative
      ? ratingQualitative.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : null;

    // Optional: NLP Analysis for inappropriate language (Simulated for this phase)
    const isFlagged = checkInappropriateLanguage(sanitizedFeedback);

    // Get Course ID from CourseLecturer relation
    const courseLecturer = await prisma.courseLecturer.findUnique({
      where: { id: courseLecturerId },
      include: { course: true },
    });

    if (!courseLecturer) {
      return NextResponse.json({ error: "Invalid course lecturer assignment" }, { status: 404 });
    }

    // 1. Strict Check: Is the student actually enrolled in this course?
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId,
        courseId: courseLecturer.courseId,
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: "You are not enrolled in this course." }, { status: 403 });
    }

    // 2. Strict Check: Is the evaluation window currently open?
    // In a full production app, this would be a query to a SystemSettings table.
    // For now, we enforce a strict date boundary check.
    const today = new Date();
    const evaluationWindowEnd = new Date(today.getFullYear(), 11, 31); // Dec 31 of current year
    if (today > evaluationWindowEnd) {
       return NextResponse.json({ error: "The evaluation window for this academic term is closed." }, { status: 403 });
    }

    // 3. Strict Check: Prevent Duplicates (Anonymity & Integrity)
    // We store studentId but it will never be returned in GET requests for lecturers/officials
    const academicDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const existingEval = await prisma.evaluation.findFirst({
      where: {
        studentId,
        courseLecturerId,
      }
    });

    if (existingEval) {
      return NextResponse.json({ error: "You have already submitted an evaluation for this lecturer in this course." }, { status: 409 });
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        courseId: courseLecturer.courseId,
        courseLecturerId,
        studentId,
        academicDate,
        timeSlot: `${today.getHours()}:00 - ${today.getHours() + 1}:00`, // Simplification
        ratingQuantitative,
        ratingQualitative: sanitizedFeedback,
        themes: Array.isArray(themes) ? themes : [],
        isFlagged,
      }
    });

    if (isFlagged) {
      // Find QA Officials (Admins)
      const qaOfficials = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

      // We don't want to block the request on emails/notifications
      Promise.all(qaOfficials.map(async (official) => {
        // Create in-app notification
        await prisma.notification.create({
          data: {
            recipientId: official.id,
            title: "Flagged Evaluation Alert",
            message: `An evaluation for ${courseLecturer.course.title} requires manual review due to inappropriate language.`,
            link: `/dashboard/reports?evaluationId=${evaluation.id}`
          }
        });

        // Send email
        await sendQANotificationEmail({
          to: official.email,
          subject: "Urgent: Flagged Evaluation Requires Review",
          qaOfficialName: official.firstName,
          courseName: courseLecturer.course.title,
          alertReason: "Automated heuristic detected potential inappropriate language or policy violation.",
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/reports?evaluationId=${evaluation.id}`
        });
      })).catch(err => console.error("Failed to process flag notifications:", err));
    }

    // Trigger AI analysis for qualitative feedback enrichment
    if (sanitizedFeedback && sanitizedFeedback.trim().length >= 5) {
      await triggerEvaluationAnalysis(evaluation.id, sanitizedFeedback).catch(err => {
        console.error("Failed to trigger AI analysis:", err);
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Evaluation submitted securely and anonymously" 
    }, { status: 201 });

  } catch (error) {
    console.error("Evaluation Submission Error:", error);
    return NextResponse.json({ error: "Failed to submit evaluation" }, { status: 500 });
  }
}

// Simple heuristic for demo purposes
function checkInappropriateLanguage(text: string | null): boolean {
  if (!text) return false;
  const badWords = ["stupid", "idiot", "hate", "terrible", "awful"]; // Mock list
  const lowerText = text.toLowerCase();
  return badWords.some(word => lowerText.includes(word));
}
