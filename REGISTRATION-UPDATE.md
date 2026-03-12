# Registration Page Update

## Changes Made

Updated the registration page to allow both students and instructors to register directly without requiring an invitation.

## New Registration Flow

### For Students
1. Go to `/register`
2. Select "Student" from the "I am a" dropdown
3. Fill in:
   - Name
   - Email
   - Enrollment Number (optional - to auto-join a class)
   - Password
4. Receive OTP via email
5. Verify OTP to complete registration

### For Instructors
1. Go to `/register`
2. Select "Instructor" from the "I am a" dropdown
3. Fill in:
   - Name
   - Email
   - Password
4. Receive OTP via email
5. Verify OTP to complete registration

### Via Invitation (Instructors Only)
- Instructors can still be invited via invitation link
- When using an invitation link, the role is automatically set to "Instructor"
- Email is pre-filled from the invitation

## Key Features

### Role Selection
- **Student**: Can join classes using enrollment codes
- **Instructor**: Can create classes and manage exams

### Enrollment Number (Students Only)
- Optional field for students
- If provided, student is automatically enrolled in the class after registration
- Helps streamline the onboarding process

### Smart UI
- Enrollment number field only shows for students
- Help text changes based on selected role
- Clear indication of what each role can do

## Updated UI Elements

### Role Dropdown
```
I am a:
[ Student ▼ ]
[ Instructor ]

Help text:
- Student: "Students can join classes using enrollment codes."
- Instructor: "Instructors can create classes and manage exams."
```

### Registration Description
- Generic: "Create your account to get started with QBMS."
- With enrollment code: "Create your account to join the class."
- With invitation: "You were invited as an instructor. Complete your registration below."

## Backend Support

The backend already supports both registration flows:
- ✅ Student registration with optional enrollment number
- ✅ Instructor registration (direct or via invitation)
- ✅ OTP verification for both roles
- ✅ Auto-enrollment for students with enrollment codes

## Testing

### Test Student Registration
1. Go to `http://localhost:3000/register`
2. Select "Student"
3. Fill in details
4. Check email for OTP
5. Verify and login

### Test Instructor Registration
1. Go to `http://localhost:3000/register`
2. Select "Instructor"
3. Fill in details
4. Check email for OTP
5. Verify and login

### Test Student with Enrollment Code
1. Go to `http://localhost:3000/register`
2. Select "Student"
3. Enter enrollment number (e.g., from a class)
4. Complete registration
5. Should be automatically enrolled in the class

## Security Considerations

### Open Registration
- Both students and instructors can now register freely
- Consider adding email domain restrictions if needed
- Super admin can still manage and deactivate accounts

### Email Verification
- All registrations require OTP verification
- Prevents fake accounts
- Ensures valid email addresses

### Role-Based Access
- Students: Limited to joining classes and taking exams
- Instructors: Can create classes, questions, and exams
- Super Admin: Full system access

## Future Enhancements

1. **Email Domain Restrictions**
   - Restrict instructor registration to specific email domains
   - Example: Only @university.edu can register as instructors

2. **Approval Workflow**
   - Require super admin approval for instructor accounts
   - Auto-approve students, manual approve instructors

3. **Registration Codes**
   - Provide registration codes for instructors
   - Similar to enrollment codes for students

4. **Bulk Registration**
   - Allow super admin to bulk import students/instructors
   - CSV upload with email, name, role

## Files Modified

- ✅ `apps/web/src/app/register/page.tsx` - Updated role selection and UI

## No Backend Changes Required

The backend already supports this functionality. No API changes needed.
