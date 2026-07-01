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
    const { courseLecturerId, scaleRatings, qualitativeAnswers, token } = body;

    if (!courseLecturerId || !scaleRatings || !token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Strict Check: Verify Evaluation Token
    const evalToken = await prisma.evaluationToken.findUnique({
      where: { token }
    });

    if (!evalToken || evalToken.studentId !== studentId || evalToken.courseLecturerId !== courseLecturerId) {
      return NextResponse.json({ error: "Invalid or unauthorized evaluation token." }, { status: 403 });
    }

    if (evalToken.isUsed) {
      return NextResponse.json({ error: "This evaluation token has already been consumed." }, { status: 409 });
    }

    // Get Course ID from CourseLecturer relation
    const courseLecturer = await prisma.courseLecturer.findUnique({
      where: { id: courseLecturerId },
      include: { course: true },
    });

    if (!courseLecturer) {
      return NextResponse.json({ error: "Invalid course lecturer assignment" }, { status: 404 });
    }

    // 2. Strict Check: Is the evaluation window currently open?
    const settings = await prisma.systemSetting.findFirst();
    const today = new Date();
    
    if (settings) {
      if (today < settings.evalWindowStartDate || today > settings.evalWindowEndDate) {
        return NextResponse.json({ error: "The evaluation window for this academic term is closed." }, { status: 403 });
      }
    } else {
      const evaluationWindowEnd = new Date(today.getFullYear(), 11, 31);
      if (today > evaluationWindowEnd) {
         return NextResponse.json({ error: "The evaluation window for this academic term is closed." }, { status: 403 });
      }
    }

    // Calculate summary statistics
    const scaleValues = Object.values(scaleRatings) as number[];
    const ratingQuantitative = scaleValues.length > 0 
      ? Math.round(scaleValues.reduce((a, b) => a + b, 0) / scaleValues.length) 
      : 0;

    const allQualitativeText = Object.values(qualitativeAnswers || {})
      .filter((text: any) => typeof text === 'string' && text.trim().length > 0)
      .join('\n\n');
    
    const sanitizedFeedback = allQualitativeText.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
    const isFlagged = checkInappropriateLanguage(sanitizedFeedback);

    const academicDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 3. Create the Evaluation and consume the token in a transaction
    const evaluation = await prisma.$transaction(async (tx) => {
      // Mark token as used
      await tx.evaluationToken.update({
        where: { id: evalToken.id },
        data: { isUsed: true, usedAt: new Date() }
      });

      // Create anonymous evaluation
      const evalRecord = await tx.evaluation.create({
        data: {
          courseId: courseLecturer.courseId,
          courseLecturerId,
          academicDate,
          timeSlot: `${today.getHours()}:00 - ${today.getHours() + 1}:00`,
          ratingQuantitative,
          ratingQualitative: sanitizedFeedback || null,
          themes: [],
          isFlagged,
        }
      });

      // Insert granular responses
      const responsePromises: any[] = [];
      for (const [criterionId, score] of Object.entries(scaleRatings)) {
        responsePromises.push(
          tx.evaluationResponse.create({
            data: {
              evaluationId: evalRecord.id,
              criterionId,
              score: score as number,
            }
          })
        );
      }
      for (const [criterionId, text] of Object.entries(qualitativeAnswers || {})) {
        if (text && (text as string).trim() !== "") {
          responsePromises.push(
            tx.evaluationResponse.create({
              data: {
                evaluationId: evalRecord.id,
                criterionId,
                text: (text as string).trim(),
              }
            })
          );
        }
      }
      await Promise.all(responsePromises);

      return evalRecord;
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
