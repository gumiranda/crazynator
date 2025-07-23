# Implementation Plan

- [ ] 1. Set up Cloudflare R2 integration and configuration
  - Install and configure AWS SDK for R2 compatibility
  - Create R2 service class with upload/download URL generation
  - Add R2 environment variables and configuration
  - Write unit tests for R2 service operations
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 2. Extend database schema for image storage
  - Create Prisma migration for Image model
  - Update Message model to include images relationship
  - Generate Prisma client with new schema
  - Write database seed data for testing
  - _Requirements: 3.1, 6.3_

- [ ] 3. Create image validation utilities
  - Implement file type validation functions
  - Create file size validation logic
  - Add MIME type verification against file headers
  - Write comprehensive validation tests
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 4. Build image upload tRPC procedures
  - Create images router with upload procedure
  - Implement signed URL generation endpoint
  - Add image metadata storage logic
  - Create image retrieval procedures
  - Write integration tests for image procedures
  - _Requirements: 1.1, 1.3, 3.1, 3.2_

- [ ] 5. Create ImageUploadZone component
  - Build drag-and-drop file upload interface
  - Implement file selection via click
  - Add upload progress indicators
  - Handle multiple file uploads
  - Create component unit tests
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

- [ ] 6. Build ImagePreview component
  - Create image thumbnail display
  - Implement image removal functionality
  - Add image reordering capabilities
  - Show upload status for each image
  - Write component interaction tests
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 7. Enhance MessageForm component for image support
  - Integrate ImageUploadZone into existing form
  - Update form validation to include images
  - Modify form submission to handle image data
  - Maintain existing keyboard shortcuts and UX
  - Test enhanced form functionality
  - _Requirements: 1.4, 6.3, 7.1, 7.2, 7.3_

- [ ] 8. Update message creation backend logic
  - Extend message creation procedure to handle images
  - Implement image metadata storage in database
  - Add transaction handling for message + images
  - Update error handling for image failures
  - Write integration tests for enhanced message creation
  - _Requirements: 1.3, 1.5, 3.4_

- [ ] 9. Enhance AI processing for multimodal prompts
  - Update Inngest function to process image data
  - Create image context preparation for AI
  - Implement multimodal prompt construction
  - Add error handling for image processing failures
  - Test AI integration with image + text prompts
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 10. Add image display in message history
  - Update message display components to show images
  - Implement secure image URL generation for display
  - Add image loading states and error handling
  - Create responsive image display layout
  - Test message history with images
  - _Requirements: 4.3, 7.1, 7.2, 7.3_

- [ ] 11. Implement image cleanup and management
  - Create scheduled job for orphaned image cleanup
  - Add image deletion when messages are removed
  - Implement storage usage tracking
  - Create admin utilities for image management
  - Write tests for cleanup functionality
  - _Requirements: 3.3_

- [ ] 12. Add comprehensive error handling and user feedback
  - Implement client-side error display for upload failures
  - Add server-side error responses with clear messages
  - Create fallback behavior for R2 service failures
  - Add retry logic for failed uploads
  - Test error scenarios and recovery flows
  - _Requirements: 1.5, 2.4, 3.4_

- [ ] 13. Optimize performance and add mobile support
  - Implement client-side image compression
  - Add progressive upload with cancellation
  - Ensure mobile browser compatibility
  - Add camera access for mobile devices
  - Test performance with large images and multiple uploads
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14. Create end-to-end tests for complete image workflow
  - Write E2E tests for image upload to AI response flow
  - Test error recovery and edge cases
  - Validate security controls and access restrictions
  - Test cross-browser compatibility
  - Performance test with realistic usage scenarios
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3_
