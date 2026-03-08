# QBMS User Guide

Complete guide for using the Question Bank Management System.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Super Admin Guide](#super-admin-guide)
3. [Instructor Guide](#instructor-guide)
4. [Student Guide](#student-guide)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the System

1. Open your web browser
2. Navigate to: http://localhost:8080 (or your deployment URL)
3. You'll see the login page

### First Time Login

Use the credentials from CREDENTIALS.md:

- **Super Admin**: superadmin@qbms.local / Admin@123
- **Instructor**: instructor@qbms.local / Admin@123
- **Student**: student@qbms.local / Admin@123

**Important**: Change your password after first login!

### Registering a New Account

1. Click "Register" on the login page
2. Fill in your details:
   - Full Name
   - Email address
   - Password (minimum 8 characters)
   - Role (Student or Instructor with invite code)
3. Click "Register"
4. Check your email for the OTP verification code
5. Enter the OTP code to complete registration
6. Login with your new credentials

### Password Reset

If you forget your password:

1. Click "Forgot Password?" on the login page
2. Enter your email address
3. Check your email for the reset link
4. Click the link and enter your new password
5. Login with your new password

---

## Super Admin Guide

Super Admins have full access to all system features and can manage users and system settings.

### Dashboard Overview

After login, you'll see:
- Total number of users, classes, exams, and questions
- Recent activity
- System health status

### Managing Instructors

#### Invite an Instructor

1. Go to **Dashboard** → **Invite Instructor**
2. Enter the instructor's email address
3. Click "Send Invite"
4. The instructor will receive an email with an invite link
5. They can register using the invite token

#### View All Users

1. Navigate to **Users** (if available)
2. See list of all users with their roles
3. Filter by role: Super Admin, Instructor, Student
4. View user details and activity

### System Monitoring

#### Health Checks

- **API Health**: Dashboard shows API status
- **Database**: Check database connection status
- **Redis**: Verify cache service is running

#### Audit Logs

1. Go to **Audit Logs** (if available)
2. View all system activities:
   - User logins
   - Resource creation/updates/deletions
   - Failed login attempts
3. Filter by:
   - User
   - Action type
   - Date range
   - Resource type

### Managing Content

Super Admins can:
- Create and manage all subjects
- Create and manage all topics
- View all questions
- Access all classes and exams
- View all student attempts and results

---

## Instructor Guide

Instructors can create content, manage classes, and conduct exams.

### Dashboard Overview

Your dashboard shows:
- Number of classes you teach
- Total exams created
- Total questions in your question bank
- Recent student activity

### Managing Subjects

#### Create a Subject

1. Go to **Dashboard** → **Subjects**
2. Click "Add Subject"
3. Enter:
   - Subject Name (e.g., "Mathematics")
   - Description (optional)
4. Click "Create"

#### Edit or Delete Subject

1. Find the subject in the list
2. Click the edit icon to modify
3. Click the delete icon to remove (warning: this deletes all related topics and questions)

### Managing Topics

#### Create a Topic

1. Go to **Dashboard** → **Topics**
2. Click "Add Topic"
3. Select the subject
4. Enter topic name (e.g., "Calculus")
5. Click "Create"

### Building Question Bank

#### Create a Question Manually

1. Go to **Dashboard** → **Questions**
2. Click "Add Question"
3. Fill in the form:
   - **Topic**: Select from dropdown
   - **Question Text**: Enter the question
   - **Type**: Choose MCQ, Short Answer, or Essay
   - **Difficulty**: Easy, Medium, or Hard
   - **Marks**: Points for this question
4. For MCQ questions:
   - Add options (minimum 2)
   - Mark the correct answer(s)
5. Click "Create"

#### Generate Questions with AI

1. Go to **Dashboard** → **Questions**
2. Click "Generate with AI"
3. Configure:
   - Topic
   - Question type
   - Difficulty level
   - Number of questions
   - Marks per question
4. Click "Generate"
5. Review generated questions
6. Edit if needed
7. Save to question bank

**Note**: Requires OPENAI_API_KEY to be configured.

#### Edit or Delete Questions

1. Find the question in the list
2. Click edit to modify
3. Click delete to remove

### Managing Classes

#### Create a Class

1. Go to **Dashboard** → **Classes**
2. Click "Create Class"
3. Enter:
   - Class Name (e.g., "Math 101 - Section A")
   - Select Subject
4. Click "Create"
5. Note the **Enrollment Code** - share this with students

#### View Class Details

1. Click on a class name
2. See:
   - Enrollment code
   - Number of enrolled students
   - Associated exams
3. Share the enrollment code with students

### Creating Exams

#### Create an Exam

1. Go to **Dashboard** → **Exams**
2. Click "Create Exam"
3. Fill in details:
   - **Title**: Exam name
   - **Class**: Select the class
   - **Total Marks**: Maximum score
   - **Time Limit**: Duration in minutes
   - **Scheduled At**: When exam becomes available (optional)
4. Click "Create"

#### Add Questions to Exam

1. Open the exam
2. Click "Add Questions"
3. Select questions from your question bank
4. Arrange questions in order
5. Save

#### Generate Question Paper

1. Go to **Dashboard** → **Paper**
2. Click "Generate Paper"
3. Configure:
   - Subject
   - Topics to include
   - Total marks
   - Difficulty distribution:
     - Easy: X%
     - Medium: Y%
     - Hard: Z%
4. Click "Generate"
5. Review the generated paper
6. Use these questions to create an exam

#### Publish an Exam

1. Go to **Dashboard** → **Exams**
2. Find your exam (status: Draft)
3. Click "Publish"
4. Exam status changes to "Active"
5. Students can now see and take the exam

#### Unpublish an Exam

1. Find the active exam
2. Click "Unpublish"
3. Exam becomes unavailable to students

### Viewing Results

#### View All Attempts

1. Go to **Dashboard** → **Exams**
2. Click on an exam
3. See list of all student attempts:
   - Student name
   - Start time
   - Submission time
   - Score
   - Status

#### View Individual Result

1. Click on a student's attempt
2. See detailed breakdown:
   - Total score and percentage
   - Grade
   - Per-question analysis
   - Correct/incorrect answers

### Analytics

1. Go to **Dashboard** → **Analytics**
2. View:
   - Total classes taught
   - Total exams created
   - Total attempts
   - Average score across all exams
   - Performance trends

---

## Student Guide

Students can enroll in classes, take exams, and view their results.

### Dashboard Overview

Your dashboard shows:
- Classes you're enrolled in
- Available exams
- Completed exams
- Your performance statistics

### Enrolling in a Class

1. Go to **Dashboard** → **Classes**
2. Click "Join Class"
3. Enter the **Enrollment Code** provided by your instructor
4. Click "Join"
5. You're now enrolled!

### Viewing Available Exams

1. Go to **Dashboard** → **Exams**
2. See list of exams from your enrolled classes
3. Exam status:
   - **Active**: You can take this exam
   - **Scheduled**: Exam will be available at the scheduled time
   - **Completed**: Exam is closed

### Taking an Exam

#### Start an Exam

1. Go to **Dashboard** → **Exams**
2. Find an active exam
3. Click "Start Exam"
4. Read the instructions:
   - Total marks
   - Time limit
   - Number of questions
5. Click "Begin"

#### During the Exam

1. **Timer**: Visible at the top, counts down
2. **Questions**: Displayed one at a time or all together
3. **Answering**:
   - **MCQ**: Select one option
   - **Short Answer**: Type your answer
   - **Essay**: Write your response
4. **Navigation**: Move between questions
5. **Auto-save**: Your answers are saved automatically

#### Submit the Exam

1. Answer all questions
2. Review your answers
3. Click "Submit Exam"
4. Confirm submission
5. You cannot change answers after submission

#### If Time Runs Out

- Exam auto-submits when timer reaches zero
- All saved answers are submitted
- You'll see your result immediately (for MCQ questions)

### Viewing Results

#### View Your Result

1. Go to **Dashboard** → **Exams**
2. Find the completed exam
3. Click "View Result"
4. See:
   - Total score
   - Percentage
   - Grade (A, B, C, D, F)
   - Per-question breakdown
   - Correct answers (for MCQ)

#### Understanding Your Grade

- **A**: 90% and above
- **B**: 80-89%
- **C**: 70-79%
- **D**: 60-69%
- **F**: Below 60%

### Analytics

1. Go to **Dashboard** → **Analytics**
2. View your performance:
   - Total exams taken
   - Average score
   - Highest score
   - Lowest score
   - Performance trends

---

## Common Tasks

### Changing Your Password

1. Click on your profile (top right)
2. Select "Change Password"
3. Enter:
   - Current password
   - New password
   - Confirm new password
4. Click "Update"

### Updating Your Profile

1. Click on your profile
2. Select "Edit Profile"
3. Update your information
4. Click "Save"

### Logging Out

1. Click on your profile (top right)
2. Select "Logout"
3. You'll be redirected to the login page

---

## Troubleshooting

### Cannot Login

**Problem**: "Invalid email or password"

**Solutions**:
- Check your email and password are correct
- Use "Forgot Password?" to reset
- Ensure Caps Lock is off
- Contact your administrator

**Problem**: "Account is locked"

**Solutions**:
- Wait 15 minutes and try again
- Contact your administrator to unlock
- Too many failed login attempts trigger lockout

### Cannot Register

**Problem**: "Email already registered"

**Solutions**:
- Use a different email address
- Try logging in instead
- Use "Forgot Password?" if you forgot your password

**Problem**: "Invalid invite token" (Instructor registration)

**Solutions**:
- Check the invite link is correct
- Invite may have expired (valid for 7 days)
- Request a new invite from administrator

### OTP Issues

**Problem**: "OTP not received"

**Solutions**:
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes for delivery
- Try registering again

**Problem**: "Invalid or expired OTP"

**Solutions**:
- OTP expires in 10 minutes
- Check you entered the code correctly
- Request a new OTP by registering again

### Exam Issues

**Problem**: "Cannot start exam"

**Solutions**:
- Ensure exam status is "Active"
- Check you're enrolled in the class
- Verify exam hasn't expired
- Refresh the page

**Problem**: "Exam timer not showing"

**Solutions**:
- Refresh the page
- Check your internet connection
- Clear browser cache
- Try a different browser

**Problem**: "Answers not saving"

**Solutions**:
- Check internet connection
- Don't use browser back button
- Stay on the exam page
- Answers auto-save every few seconds

### Performance Issues

**Problem**: "Page loading slowly"

**Solutions**:
- Check your internet connection
- Clear browser cache
- Close unnecessary tabs
- Try a different browser
- Contact administrator if issue persists

### Browser Compatibility

**Recommended Browsers**:
- Google Chrome (latest)
- Mozilla Firefox (latest)
- Microsoft Edge (latest)
- Safari (latest)

**Not Recommended**:
- Internet Explorer (any version)
- Very old browser versions

---

## Tips for Best Experience

### For Instructors

1. **Organize your question bank** by topics and difficulty
2. **Use AI generation** to quickly build question banks
3. **Test your exams** before publishing
4. **Set realistic time limits** for exams
5. **Review results** to identify areas where students struggle
6. **Keep enrollment codes** secure and share only with enrolled students

### For Students

1. **Enroll early** in your classes
2. **Check for exams regularly** on your dashboard
3. **Note exam schedules** and set reminders
4. **Test your internet connection** before starting an exam
5. **Read questions carefully** during exams
6. **Manage your time** - don't spend too long on one question
7. **Review your results** to learn from mistakes

---

## Getting Help

### Contact Support

If you encounter issues not covered in this guide:

1. Check the **README.md** for technical information
2. Review **API-DOCUMENTATION.md** for API details
3. Contact your system administrator
4. Report bugs or issues to the development team

### Reporting Bugs

When reporting issues, include:
- Your role (Super Admin, Instructor, Student)
- What you were trying to do
- What happened vs. what you expected
- Browser and version
- Screenshots (if applicable)
- Error messages (if any)

---

## Keyboard Shortcuts

- **Ctrl/Cmd + Enter**: Submit form (where applicable)
- **Esc**: Close modal/dialog
- **Tab**: Navigate between form fields

---

## Privacy and Security

### Your Data

- Passwords are encrypted and never stored in plain text
- Your personal information is kept confidential
- Only instructors and admins can see your exam results
- Audit logs track system activities for security

### Best Practices

1. **Never share your password** with anyone
2. **Use a strong password** (mix of letters, numbers, symbols)
3. **Log out** when using shared computers
4. **Don't share enrollment codes** publicly
5. **Report suspicious activity** to administrators

---

*Last updated: [Date]*
