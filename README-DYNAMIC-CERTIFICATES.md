# Dynamic Certificates in EduTube

## Overview

Dynamic Certificates are a powerful feature in EduTube that allows certificates to evolve over time as users complete more courses. Unlike traditional static certificates that represent a single achievement, dynamic certificates represent a living record of a user's learning journey.

## Key Features

- **Updateable Content**: Certificates automatically update to reflect new completed courses
- **Blockchain Verification**: Each certificate version is optionally recorded on the Polygon blockchain 
- **Immutable History**: While the certificate content changes, the history of achievements is preserved
- **Single Verification Link**: The same verification URL works throughout the certificate's lifetime
- **PDF Generation**: A PDF is regenerated with the latest achievements each time the certificate is updated
- **IPFS Storage**: Each version of the certificate can be stored on IPFS for permanent reference

## How It Works

1. A user completes their first course and passes the quiz
2. An initial certificate is generated with that course
3. When they complete additional courses, these are added to the same certificate
4. The certificate updates with new courses, showing their growing expertise
5. The verification URL remains the same, but shows the latest version of the certificate
6. Each version of the certificate can be minted as an NFT if desired

## Technical Implementation

### Database Models

- `Certificate`: The main certificate model with fields for tracking if it's dynamic
- `CertificateCourse`: Associates multiple courses with a certificate
- `CertificateVerification`: Tracks verification attempts

### API Endpoints

- `POST /api/certificates/`: Create a new certificate
- `POST /api/certificates/{id}/add_course/`: Add a new course to an existing certificate
- `GET /api/certificates/{id}/`: Get certificate details including all courses
- `GET /api/verify/{certificate_id}/`: Verify a certificate by its ID (public endpoint)
- `POST /api/certificates/{id}/mint_nft/`: Mint the certificate as an NFT

### PDF Generation

The certificate PDF is generated dynamically based on:
- The user's profile information
- All courses associated with the certificate
- Quiz scores for each course
- Latest update date

## Using Dynamic Certificates

### For Learners

1. Complete a course and pass its quiz
2. Receive your initial certificate
3. Complete additional related courses
4. Your certificate automatically updates with these achievements
5. Share the same verification link to showcase your growing skills

### For Verifiers

1. Receive a certificate verification link
2. Access the link to see all courses completed by the learner
3. Verify the authenticity through blockchain validation if available
4. See when the certificate was last updated

## Best Practices

- Group related courses in the same certificate to show expertise in a domain
- Create separate certificates for unrelated topics
- Mint a new NFT after significant updates to your certificate
- Use the verification link in your resume or LinkedIn profile

## Technical Notes for Developers

- The `metadata` field in the `Certificate` model stores additional information like average scores
- Certificate PDFs are regenerated each time a new course is added
- Generating a new PDF doesn't invalidate previous blockchain records
- You can access all courses in a certificate through the `certificate_courses` relation
- The certificate's `last_updated` timestamp is automatically updated when courses are added

## Future Enhancements

- Certificate templates for different domains
- Skill badges within certificates
- Expiration dates for time-sensitive certifications
- Interactive verification with QR codes 