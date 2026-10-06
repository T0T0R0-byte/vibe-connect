# VibeConnect Project Documentation

## Project
VibeConnect is a centralized workshop discovery, booking, payment, refund, and management platform.

The project began in Semester 1 as a Commercial Computing proposal and was implemented and refined across three Agile development sprints in Semester 2.

## Problem
The initial research identified a fragmented workshop booking process. Workshops were commonly promoted through Instagram, WhatsApp, Facebook Messenger, phone calls, and word of mouth. Registration often relied on Google Forms or direct messages. Payments and refunds were handled manually.

The Semester 1 proposal reported the following survey findings:
- 100% of respondents reported slow replies from organizers.
- 67% found the registration process burdensome because it involved multiple steps and lacked instant confirmation.
- 78% reported unclear refund or cancellation rules.
- Communication with organizers commonly happened through Instagram, WhatsApp, and phone calls.

The target users were grouped into children aged 3-15, young adults aged 16-25, and adults aged 25+.

## Solution
VibeConnect brings the workflow into one platform.

Participants receive:
- Workshop discovery with search and filtering.
- Detailed workshop information.
- Guided registration for one or multiple participants.
- Consent capture for under-18 participants.
- Online payment through Stripe.
- Booking and payment status visibility.
- Refund requests and refund status tracking.
- Ratings and reviews subject to workshop completion rules.
- Workshop issue reporting.

Vendors receive:
- Workshop creation, editing, and deletion.
- Participant management.
- Refund policy configuration.
- Refund request handling.
- Revenue and reporting dashboards.
- Workshop freezing after registrations.
- Customer and consent visibility.
- Custom workshop request management.

Administrators receive:
- Vendor verification and management.
- User management.
- Payment approval and monitoring.
- Refund oversight.
- Reporting and issue monitoring.
- System-wide control.

## Architecture evolution
The Semester 1 proposal originally described a static frontend with an API layer and PostgreSQL database. During implementation, the architecture evolved into a full Next.js application backed by Firebase services and Stripe.

| Layer | Final implementation |
|---|---|
| Frontend | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS 4 |
| Authentication | Firebase Authentication |
| Database | Firebase Firestore |
| File storage | Firebase Storage |
| Payments | Stripe |
| Charts | Recharts |
| PDF generation | jsPDF |
| Animation | Framer Motion, Lenis |
| Testing | Playwright |
| Hosting | Vercel |

## Commercial model
The original project proposal defined a 2% commission on paid bookings as the primary revenue model, supported by sponsored event placements and partnerships with local businesses.

## Academic development path
### Semester 1
The group:
1. Studied the workshop and activity-booking domain.
2. Gathered participant requirements through a structured survey.
3. Compared existing approaches including Instagram, WhatsApp, Google Forms, Facebook Events, and Eventbrite.
4. Defined stakeholder needs and user personas.
5. Designed the VibeConnect solution and initial mockups.
6. Presented the proposal and refined the solution from feedback.

### Semester 2
The group moved from proposal to implementation using Agile development.

The final system was delivered through three development sprints:
- Sprint 1: workshop discovery, booking, and vendor management.
- Sprint 2: admin control, payment confirmation, refund foundation, bulk booking, and consent forms.
- Sprint 3: authentication, Stripe integration, advanced refund handling, reporting, workshop freezing, review validity, and security improvements.

Sprint 4 documentation and presentation material consolidated the completed implementation and evidence.

## Contributors
### Group 11
| Contributor | Student ID |
|---|---|
| Sanuthi Vinsith Mayadunna | CB012708 |
| Faraj Farook | CB012653 |
| Tony Willis David | CB015830 |

The module required Agile role rotation. The project documentation records the following sprint roles:

| Sprint | Sanuthi | Faraj | Tony |
|---|---|---|---|
| Sprint 1 | Scrum Master / Business Analyst | Developer | QA |
| Sprint 2 | Developer | QA | Scrum Master / Business Analyst |
| Sprint 3 | QA | Developer | Business Analyst / Scrum Master |

This rotation gave each member exposure to analysis, project coordination, development, and quality assurance.

## Final outcome
VibeConnect evolved from a proposed workshop directory into a working platform covering the workshop lifecycle from discovery and registration through payment, refunds, reporting, and administration.

The project also includes automated UI testing, user acceptance testing, and security testing evidence.