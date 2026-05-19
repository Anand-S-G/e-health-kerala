import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find appointments happening within the next 24 hours
    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        datetime: {
          gte: new Date(),
          lt: tomorrow,
        },
        status: 'SCHEDULED'
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    const { transporter } = await import('@/lib/mailer');

    for (const apt of upcomingAppointments) {
      const time = new Date(apt.datetime).toLocaleString();
      
      // Send reminder to patient
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: apt.patient.email,
        subject: 'Appointment Reminder - E-Health Kerala',
        text: `You have an upcoming telemedicine appointment with Dr. ${apt.doctor.name} at ${time}.`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #0ea5e9;">Appointment Reminder</h2>
                <p>You have an upcoming telemedicine appointment with <strong>Dr. ${apt.doctor.name}</strong> at <strong>${time}</strong>.</p>
                <p>Please login to your dashboard to join the call at the scheduled time.</p>
               </div>`
      };
      
      await transporter.sendMail(mailOptions);
      
      // Send reminder to doctor
      const mailOptionsDoc = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: apt.doctor.email,
        subject: 'Upcoming Appointment - E-Health Kerala',
        text: `You have an upcoming telemedicine appointment with ${apt.patient.name} at ${time}.`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #10b981;">Appointment Scheduled</h2>
                <p>You have an upcoming telemedicine appointment with <strong>${apt.patient.name}</strong> at <strong>${time}</strong>.</p>
                <p>Please login to your dashboard to join the call at the scheduled time.</p>
               </div>`
      };
      await transporter.sendMail(mailOptionsDoc);
    }

    return NextResponse.json({ success: true, emailsSent: upcomingAppointments.length * 2 });
  } catch (err) {
    console.error('Reminder Cron Error:', err);
    return NextResponse.json({ error: 'Reminder processing failed' }, { status: 500 });
  }
}
