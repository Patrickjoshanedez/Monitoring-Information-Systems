<!-- 237bf2ef-0796-4209-880c-3f00efa52a58 ac5698e4-561a-449f-b27f-060719332163 -->
# Mentee Application Flow Implementation

## Overview
Implement a post-login application flow where new mentees must fill out an application form and wait for admin approval before accessing the full dashboard.

## User Flow
1. User registers/logs in as mentee → Application form appears
2. User submits application → Pending approval status page
3. Admin approves → User gets full dashboard access

## Implementation Steps

### 1. Create MenteeApplicationForm Component
**File:** `frontend/src/pages/MenteeApplicationForm.jsx`

**Features:**
- Personal info fields: Firstname, Lastname, Institutional Email (pre-filled from auth)
- Year Level dropdown (1st Year, 2nd Year, 3rd Year, 4th Year)
- Program text input
- Specific Skills text input
- Certificate of Registration (COR) file upload button
- Major selection buttons: Computer Programming, Web Development, Database Management, Networking
- Programming Language dropdown: C, Java, Python, JavaScript, etc.
- Optional textarea: "Why do you want to join this program?"
- Purple Submit button
- Purple border inputs matching auth pages design
- Responsive grid layout

### 2. Create PendingApprovalPage Component
**File:** `frontend/src/pages/PendingApprovalPage.jsx`

**Features:**
- Centered card layout
- Icon/illustration showing waiting status
- Message: "Your application is under review"
- Application details summary
- Status: "Pending Admin Approval"
- Expected timeline message
- Logout button
- Auto-refresh to check approval status

### 3. Update User Model (Backend)
**File:** `backend/src/models/User.js`

**Add fields:**
- `applicationStatus`: enum ['not_submitted', 'pending', 'approved', 'rejected']
- `applicationData`: object {
  - yearLevel, program, specificSkills, corUrl, major, programmingLanguage, motivation
}
- Default `applicationStatus` to 'not_submitted' for new mentees

### 4. Create Application API Routes (Backend)
**File:** `backend/src/routes/applicationRoutes.js`

**Endpoints:**
- `POST /api/mentee/application/submit` - Submit application
- `GET /api/mentee/application/status` - Check application status
- `GET /api/admin/applications` - List all pending applications
- `PATCH /api/admin/applications/:id/approve` - Approve application
- `PATCH /api/admin/applications/:id/reject` - Reject application

### 5. Create Application Controller (Backend)
**File:** `backend/src/controllers/applicationController.js`

**Functions:**
- `submitApplication()` - Save application data, set status to 'pending'
- `getApplicationStatus()` - Return user's application status
- `listApplications()` - Admin only, list pending applications
- `approveApplication()` - Admin only, change status to 'approved'
- `rejectApplication()` - Admin only, change status to 'rejected'

### 6. Add File Upload Middleware (Backend)
**File:** `backend/src/middleware/upload.js`

**Setup:**
- Use multer for file uploads
- Accept PDF, JPG, PNG for COR
- Store in `uploads/cor/` directory
- Max file size: 5MB
- Sanitize filenames

### 7. Update App Routing Logic (Frontend)
**File:** `frontend/src/App.tsx`

**Add route protection logic:**
- Add `/mentee/application` route → MenteeApplicationForm
- Add `/mentee/pending` route → PendingApprovalPage
- Update mentee dashboard route to check applicationStatus
- Redirect logic based on status:
  - `not_submitted` → `/mentee/application`
  - `pending` → `/mentee/pending`
  - `approved` → `/mentee/dashboard`
  - `rejected` → Show rejection message with re-apply option

### 8. Create ProtectedRoute Component
**File:** `frontend/src/components/auth/ProtectedRoute.tsx`

**Features:**
- Check user authentication
- Check application status for mentees
- Redirect to appropriate page based on status
- Loading state while checking

### 9. Update Login Flow (Frontend)
**File:** `frontend/src/features/auth/pages/LoginPage.jsx`

**After successful login:**
- Fetch user data including applicationStatus
- Store in localStorage or state management
- Redirect based on role and applicationStatus:
  - Admin → `/admin/dashboard`
  - Mentor → `/mentor/dashboard`
  - Mentee with 'not_submitted' → `/mentee/application`
  - Mentee with 'pending' → `/mentee/pending`
  - Mentee with 'approved' → `/mentee/dashboard`

### 10. Replace Current Apply Page
**File:** `frontend/src/pages/ApplyPage.tsx`

**Options:**
- Keep for mentor applications if needed
- Or repurpose for different functionality
- Or remove if only used for mentee applications

### 11. Admin Dashboard - Application Review Section
**File:** `frontend/src/components/admin/ApplicationReviewPanel.tsx`

**Features:**
- Table showing pending applications
- Columns: Name, Email, Major, Programming Language, Date Submitted
- View details button → Modal with full application
- Approve/Reject buttons
- Bulk actions support

## Design Specifications

### Application Form Styling
- Match auth pages: purple borders, rounded inputs
- Purple labels (text-purple-600)
- Gray backgrounds for major selection buttons
- Active major button: purple background
- Dropdown styling consistent with Year Level dropdown
- Submit button: purple-600 with hover effect
- Responsive: 2-column grid on desktop, 1-column on mobile

### Pending Page Styling
- Centered white card on gray background
- Purple accent colors
- Spinning loader or waiting illustration
- Clear typography hierarchy
- Logout button in top-right corner

## Files to Create/Modify

### New Files (Frontend)
1. `frontend/src/pages/MenteeApplicationForm.jsx`
2. `frontend/src/pages/PendingApprovalPage.jsx`
3. `frontend/src/components/auth/ProtectedRoute.tsx`
4. `frontend/src/components/admin/ApplicationReviewPanel.tsx`

### New Files (Backend)
1. `backend/src/routes/applicationRoutes.js`
2. `backend/src/controllers/applicationController.js`
3. `backend/src/middleware/upload.js`

### Modified Files (Frontend)
1. `frontend/src/App.tsx` - Add new routes and protection logic
2. `frontend/src/features/auth/pages/LoginPage.jsx` - Update redirect logic

### Modified Files (Backend)
1. `backend/src/models/User.js` - Add application fields
2. `backend/src/server.js` - Register application routes
3. `backend/src/routes/authRoutes.js` - Return applicationStatus in login response

## Data Structure

### Application Form Data
```javascript
{
  firstname: string,
  lastname: string,
  email: string,
  yearLevel: '1st Year' | '2nd Year' | '3rd Year' | '4th Year',
  program: string,
  specificSkills: string,
  corFile: File,
  major: 'Computer Programming' | 'Web Development' | 'Database Management' | 'Networking',
  programmingLanguage: 'C' | 'Java' | 'Python' | 'JavaScript' | 'C++' | 'Ruby' | 'Go',
  motivation: string (optional)
}
```

### User Model Update
```javascript
{
  applicationStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected',
  applicationData: {
    yearLevel, program, specificSkills, corUrl, major, programmingLanguage, motivation
  },
  applicationSubmittedAt: Date,
  applicationReviewedAt: Date,
  applicationReviewedBy: ObjectId (admin user)
}
```

### To-dos

- [ ] Create MenteeApplicationForm.jsx with all form fields and purple styling
- [ ] Create PendingApprovalPage.jsx with status display and auto-refresh
- [ ] Add applicationStatus and applicationData fields to User model
- [ ] Create applicationRoutes.js with submit and status endpoints
- [ ] Create applicationController.js with submit and approval logic
- [ ] Configure multer middleware for COR file uploads
- [ ] Add application and pending routes with protection logic in App.tsx
- [ ] Create ProtectedRoute component for route protection
- [ ] Update LoginPage to redirect based on applicationStatus
- [ ] Create ApplicationReviewPanel for admin dashboard