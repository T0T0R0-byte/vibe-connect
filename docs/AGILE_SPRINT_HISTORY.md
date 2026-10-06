# Agile Sprint History

## Sprint 1 - Foundation
### Goal
Build the core workshop discovery and booking workflow.

### Delivered
- Browse workshops by category, age group, date, price, and location.
- Keyword search.
- Workshop detail pages.
- Availability information.
- Participant booking flow.
- Order summary.
- Payment receipt upload foundation.
- Vendor workshop creation, editing, and deletion.
- Vendor participant visibility.
- UI improvements and navigation refinements.

### Team roles
- Sanuthi: Scrum Master / Business Analyst.
- Faraj: Developer.
- Tony: QA.

### Reflection
The sprint established the application structure and exposed integration challenges around React, Firebase authentication, Firestore reads and writes, and changing UI requirements.

## Sprint 2 - Commercial Reliability
### Goal
Add financial controls, administrative oversight, and stronger booking workflows.

### Delivered
- Payment confirmation workflow.
- Revenue updates only after confirmed payments.
- Bulk registration under one booking.
- Single checkout and receipt flow.
- Consent form upload for PDF/JPG/PNG files.
- Vendor and administrator visibility of consent records.
- Refund request system.
- Refund eligibility rules.
- Admin dashboard controls.
- Vendor revenue reporting.
- Custom workshop request features.
- Theme switching.

### Team roles
- Sanuthi: Developer.
- Faraj: QA.
- Tony: Scrum Master / Business Analyst.

### Testing
The sprint documentation records dedicated test cases for admin, vendor, and participant workflows, including payment confirmation, refunds, consent handling, bulk registration, custom requests, theme persistence, and role restrictions.

The recorded Sprint 2 test set contained 15 admin cases, 20 vendor cases, and 21 participant cases.

## Sprint 3 - Security and Automation
### Goal
Strengthen authentication, payment processing, refund reliability, reporting, and system security.

### Delivered
- Firebase authentication.
- Participant, vendor, and admin role restrictions.
- Stripe payment processing.
- Refund processing through the Stripe API.
- Refund eligibility enforcement.
- Duplicate refund prevention.
- Clear refund status handling.
- Rejection reason visibility.
- Workshop freezing after registrations.
- Review availability controls.
- Workshop reporting and issue resolution.
- Vendor and admin analytics.
- Regression and UI automation.

### Team roles
- Sanuthi: QA.
- Faraj: Developer.
- Tony: Business Analyst / Scrum Master.

### Lecturer feedback and refinement
Sprint 3 also incorporated feedback from the sprint review into the product backlog.

The resulting refinements addressed:
- Ambiguous refund ownership.
- Refund timing rules.
- Workshop changes after participants had registered.
- Review validity before workshop completion.
- Stripe money-flow handling.
- Reporting and issue resolution.
- Role-based access.

## Final implementation
The sprint history shows a clear progression:

Discovery -> Booking -> Payments -> Refunds -> Authentication -> Security -> Reporting -> Administration

The final system therefore covers the complete workshop lifecycle rather than a single booking form.