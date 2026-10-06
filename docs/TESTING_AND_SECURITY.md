# Testing and Security Evidence

## Automated testing
The final project includes Playwright end-to-end testing.

The repository contains suites covering:
- Critical application paths.
- Integration behaviour.
- Admin integration.
- Security access controls.
- UI and visual checks.

The visual test suite checks core public screens such as the homepage, navigation, footer, login, registration, workshop filters, FAQ, invalid-route handling, and legal/help links.

## User acceptance testing
The final sprint documentation records UAT using Participant, Vendor, and Admin roles.

Focus areas included:
- Workshop discovery and filtering.
- Booking and Stripe payment.
- Refund eligibility.
- Refund rejection reasons.
- Workshop freezing.
- Review availability after workshop completion.
- Reporting and issue resolution.
- Admin monitoring.

The recorded UAT outcome reported that users completed the tested tasks without guidance and that no major usability issues were reported.

## Security testing
Security validation included browser-based checks, Firebase Console verification, Stripe Test Mode, Nikto, and Nuclei.

### Nikto
The scan identified two low-risk hardening items:
- Access-Control-Allow-Origin: *
- Missing X-Content-Type-Options.

The final documentation recommended restricting CORS to trusted origins and adding X-Content-Type-Options: nosniff.

### Nuclei
The Nuclei scan used a large template set and reported no medium, high, or critical findings in the documented test run.

## Security controls implemented
The final application includes:
- Role-based access control.
- Firebase Authentication.
- Firestore security rules.
- Server-side Stripe operations for payment and refund actions.
- Duplicate refund prevention.
- Refund eligibility enforcement.
- Workshop freezing after registrations.
- Review restrictions based on registration and completion.
- File type restrictions for consent and payment evidence.
- Administrative approval and oversight.

## Quality approach
Testing was integrated throughout the sprints rather than being left to the end.

Unit and feature checks -> Playwright regression -> Firebase verification -> Stripe Test Mode -> UAT -> security scanning