# Implementation Plan

- [ ] 1. Set up database schema and core infrastructure
  - Add UserSettings model to Prisma schema with encrypted API key fields
  - Create and run database migration for the new table
  - Generate updated Prisma client
  - _Requirements: 5.1, 5.2_

- [ ] 2. Implement encryption service for API key security
  - Create encryption utility functions using Node.js crypto module
  - Implement encrypt/decrypt methods with AES-256-GCM
  - Add environment variable for encryption key
  - Write unit tests for encryption service
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 3. Create user settings service layer
  - Implement UserSettingsService with CRUD operations
  - Add methods for API key management (create, update, delete)
  - Implement API key validation logic for OpenAI and Anthropic
  - Add model preference management methods
  - Write unit tests for settings service
  - _Requirements: 1.2, 1.4, 2.2, 2.4, 4.1, 4.2, 4.3, 4.4_

- [ ] 4. Build model configuration service
  - Create ModelConfigService to resolve user model preferences
  - Implement fallback logic from user keys to system keys
  - Add available models enumeration based on configured API keys
  - Implement model validation and availability checking
  - Write unit tests for model configuration logic
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 6.2, 6.3_

- [ ] 5. Create tRPC API procedures for settings management
  - Add getUserSettings procedure to fetch user configuration
  - Implement updateApiKey procedure with validation
  - Add removeApiKey procedure with secure deletion
  - Create updateModelPreference procedure
  - Add getAvailableModels procedure
  - Write integration tests for API procedures
  - _Requirements: 1.1, 1.3, 2.1, 2.3, 3.3, 4.1, 4.2, 4.3_

- [ ] 6. Modify AI agent functions to use dynamic configuration
  - Update claude-functions.ts to use ModelConfigService
  - Modify functions.ts to support user-specific API keys
  - Implement dynamic model selection based on user preferences
  - Add error handling and fallback to system keys
  - Test AI functions with both user and system API keys
  - _Requirements: 1.5, 2.5, 3.5, 6.1, 6.4, 6.5_

- [ ] 7. Create settings UI components
  - Build API key input components with validation
  - Create model selection dropdown components
  - Implement masked API key display for security
  - Add form validation and error handling
  - Create settings page layout and navigation
  - _Requirements: 1.1, 1.3, 2.1, 2.3, 4.1, 5.3_

- [ ] 8. Implement settings page and user interface
  - Create settings page route and layout
  - Integrate API key management components
  - Add model selection interface
  - Implement real-time validation feedback
  - Add success/error notifications for user actions
  - _Requirements: 1.1, 1.3, 2.1, 2.3, 3.1, 3.2, 4.1, 4.2_

- [ ] 9. Add model indicator to AI interaction interface
  - Display current active model in chat interface
  - Show provider information (OpenAI/Anthropic/System)
  - Add model metadata to AI response messages
  - Implement model switching notification
  - Update message components to show model information
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Implement comprehensive error handling and fallbacks
  - Add API key validation error handling with user-friendly messages
  - Implement graceful fallback from user keys to system keys
  - Add retry logic for temporary API failures
  - Create error boundary components for settings UI
  - Add logging for API key usage and errors (without exposing keys)
  - _Requirements: 1.3, 2.3, 4.4, 5.4_

- [ ] 11. Add security middleware and access controls
  - Implement user authentication checks for settings endpoints
  - Add rate limiting for API key validation attempts
  - Ensure API keys are never logged or exposed in responses
  - Add CSRF protection for settings forms
  - Implement secure session handling for decrypted keys
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 12. Create comprehensive test suite
  - Write end-to-end tests for complete user settings flow
  - Add integration tests for AI functions with custom API keys
  - Create security tests for encryption and access control
  - Implement performance tests for API key resolution
  - Add tests for all fallback scenarios and error conditions
  - _Requirements: All requirements validation_
