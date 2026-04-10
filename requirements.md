PROJECT NAME

ReBalance Therapy

PLATFORM TYPE

Online therapy booking platform (India)

TARGET USERS

Adults 20–45
Urban professionals, students
Looking for affordable, secure online counselling

BRAND ASSETS

A logo is already provided:

Minimal line-art face

Heart emerging from mind

Deep plum outline

Soft pink heart

DO NOT redesign logo.

Extract color palette from logo and build UI around it.

🎨 DESIGN SYSTEM (MANDATORY)
Brand Colors (Derived from Logo)

Primary: #6B2C47 (Deep Plum)
Accent: #D88AA3 (Rose Pink)
Background: #FAF6F8
Dark Text: #2F1E26
Muted Text: #8B6F79

Buttons:
Primary BG: #6B2C47
Primary Hover: #5A233A
Text: White

Card Shadow:
0 4px 20px rgba(107,44,71,0.08)

Border Radius:
14px average

Style:

Soft

Airy

Emotional calm

Rounded

Subtle shadows

No harsh blue

No hospital look

🔤 TYPOGRAPHY

Primary Font: Poppins
Secondary: Inter

H1: 52px
H2: 36px
Body: 16px
Line height: 1.6

Buttons: medium weight

🧱 TECH STACK (MANDATORY)

Frontend:

Next.js 14 (App Router)

React 18

TypeScript

TailwindCSS

Shadcn UI

React Hook Form

Zod validation

Backend:

Node.js

Express.js

REST API structure

MVC architecture

Database:

MongoDB (Atlas production-ready)

Mongoose ODM

Authentication:

JWT Access Token (15 min)

Refresh Token (7 days)

HTTP-only cookies

Role-based auth (user/admin)

Payments:

Razorpay Orders API

Webhook verification

Payment → Booking confirmation flow

Email:

Nodemailer (SMTP)

Booking confirmation

Reminder emails

Video Sessions:

Zoom API OR auto-generated Google Meet link

Deployment:

Frontend: Vercel

Backend: Railway or VPS

MongoDB Atlas

Cloudflare optional

🗂 FOLDER STRUCTURE

Backend:

/src
/controllers
/models
/routes
/middlewares
/services
/utils
/config

Frontend:

/app
/components
/lib
/hooks
/types

🧠 CORE FEATURES
1️⃣ Therapist Discovery

Users can:

Search by specialty

Filter by price

Sort by rating

Filter by availability

Pagination (server-side)

2️⃣ Therapist Profile Page

Fields:

Name

Profile image

Credentials

Bio

Specialties (array)

Experience years

Price per session

Average rating

Availability calendar

Reviews list

Sticky booking card on desktop.

3️⃣ Booking Flow (Critical Logic)

Route: /book/[therapistId]

Steps:

Select session type

Select date

Select time slot

Enter details

Create Razorpay order

Payment

Webhook verifies payment

Booking confirmed

Meeting link generated

Confirmation email sent

4️⃣ Slot Locking Logic (Important)

When user selects slot:

Temporarily reserve slot for 5 minutes

Store reservation in database

If payment not completed → auto release slot

Prevent race conditions using atomic MongoDB update

🗄 MONGODB SCHEMA DESIGN

Use Mongoose models.

User Model

_id

name

email (unique)

password (hashed)

role (user/admin)

refreshToken

createdAt

Therapist Model

_id

name

bio

credentials

specialties [String]

experienceYears

price

profileImage

ratingAverage

ratingCount

createdAt

Availability Model

_id

therapistId (ObjectId)

date

slots [
{
time: String,
isBooked: Boolean,
reservedUntil: Date
}
]

Booking Model

_id

userId

therapistId

date

time

sessionType

status (pending / confirmed / cancelled)

razorpayOrderId

razorpayPaymentId

meetingLink

createdAt

Review Model

_id

userId

therapistId

rating

comment

createdAt

Coupon Model (Optional)

code

discountType (percent/fixed)

value

expiry

active

🔐 SECURITY REQUIREMENTS

bcrypt password hashing

JWT token rotation

CSRF protection

Rate limiting

Input validation with Zod

Webhook signature verification

Prevent double booking via atomic update

CORS properly configured

📧 EMAIL AUTOMATIONS

Send email on:

Booking confirmation

Payment success

Reminder 24 hours before session

Cancellation confirmation

Email must include:

Therapist name

Date & time

Meeting link

Support contact

📱 RESPONSIVE REQUIREMENTS

Mobile-first design

Sticky bottom CTA in booking

Large tap targets

Accessible color contrast (WCAG AA)

🧭 SEO REQUIREMENTS

Dynamic meta tags per therapist

SEO-friendly URLs

Sitemap.xml

Robots.txt

OpenGraph tags

JSON-LD structured data for healthcare provider

⚡ PERFORMANCE

Image optimization

Lazy load therapist images

API caching where possible

Server-side rendering for SEO pages

Code splitting

🧪 TESTING REQUIREMENTS

Test booking logic

Test slot locking

Test payment webhook

Test authentication

Handle error states gracefully

🚀 DEPLOYMENT PIPELINE

Environment variable management

Production build

MongoDB Atlas connection

SSL

Backup strategy

Error logging (Sentry optional)

📄 CLIENT-SIDE PAGES

Landing
Therapist Listing
Therapist Profile
Booking Flow (Stepper)
Login
Signup
Forgot Password
Dashboard
Booking Details
Profile Settings
About
FAQ
Privacy
404

🎯 FINAL OUTPUT EXPECTATION

AI must generate:

Design system

Full UI screens

MongoDB schema code

Mongoose models

API routes

Controller logic

Razorpay integration code

Booking slot lock logic

Email templates

Deployment guide

README documentation

Code must be:

Clean

Modular

Scalable

Production ready

Not template-level