# Questions Page Layout Fix

## Issue Fixed
The "Create with AI" and "Upload Paper" sections were appearing at the bottom of the page instead of right below their respective buttons, making the user experience confusing.

## Solution Applied
Reorganized the component layout to show sections in logical order:

### New Layout Order:
1. **Header** (Questions title + action buttons)
2. **Error messages** (if any)
3. **AI Generation section** (when "Create with AI" is clicked)
4. **Upload section** (when "Upload Paper" is clicked) 
5. **Manual form** (when "Add question" is clicked)
6. **Questions table** (always visible)

### Changes Made:
- **Moved AI section** to appear right after error messages
- **Moved Upload section** to appear after AI section
- **Removed duplicate sections** that were at the bottom
- **Maintained all functionality** while improving UX

## User Experience Improvement:
- ✅ **Immediate feedback** - sections appear right below buttons
- ✅ **Logical flow** - related content stays together
- ✅ **No scrolling confusion** - users don't have to scroll to find opened sections
- ✅ **Better visual hierarchy** - clear separation between different actions

## Files Updated:
- `apps/web/src/app/dashboard/questions/page.tsx`

## Status:
- ✅ Layout reorganized for better UX
- ✅ All functionality preserved
- ✅ Sections appear in logical order
- ❌ Needs deployment to production

The questions page now provides a much better user experience with sections appearing exactly where users expect them.