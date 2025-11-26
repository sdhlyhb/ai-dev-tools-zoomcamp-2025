# TaskFlow Testing Plan

## Manual Testing Checklist

### 1. Create Task

- [ ] Click "Create New TODO" button
- [ ] Fill in title only → Save successfully
- [ ] Fill in all fields (title, description, due date) → Save successfully
- [ ] Leave title empty → See validation error
- [ ] Verify success message appears
- [ ] Verify new task appears in list

### 2. View Tasks

- [ ] Tasks display in card view by default
- [ ] Click "List" button → Switch to table view
- [ ] Click "Cards" button → Switch back to card view
- [ ] Refresh page → Last selected view persists
- [ ] Verify statistics show: Total, Resolved, Pending counts

### 3. Edit Task

- [ ] Click "Edit" button on a task
- [ ] Modify title → Save → Verify changes appear
- [ ] Modify description → Save → Verify changes appear
- [ ] Modify due date → Save → Verify changes appear
- [ ] Click "Cancel" → Return to list without changes

### 4. Complete/Uncomplete Task

- [ ] Click "✓ Resolve" button on pending task
- [ ] Verify task shows strikethrough styling
- [ ] Verify success message appears
- [ ] Click "↺ Unresolve" button on resolved task
- [ ] Verify strikethrough removed

### 5. Delete Task

- [ ] Click "Delete" button on a task
- [ ] Verify confirmation page appears
- [ ] Click "Yes, delete" → Task removed from list
- [ ] Verify success message appears
- [ ] Click "Cancel" on delete confirmation → Return to list

### 6. Due Date & Countdown

- [ ] Create task due tomorrow → See countdown in green
- [ ] Create task due in 2 days → See countdown in yellow
- [ ] Create task due in 23 hours → See countdown in red
- [ ] Create task with past due date → See "Overdue by X" in red
- [ ] Verify countdown updates every second
- [ ] Verify overdue tasks have red pulsing border

### 7. Task Sorting

- [ ] Create 3 tasks with different due dates
- [ ] Verify earliest due date appears first
- [ ] Verify tasks are sorted by due date

### 8. Mobile Responsiveness

- [ ] Resize browser to mobile width (< 768px)
- [ ] Verify header stacks vertically
- [ ] Verify buttons become full width
- [ ] Verify cards display in single column
- [ ] Verify table scrolls horizontally
- [ ] Verify all functionality works on mobile

### 9. Navigation & UI

- [ ] Click "TaskFlow" logo → Return to home page
- [ ] Verify current date/time displays and updates
- [ ] Verify welcome message visible
- [ ] Verify footer displays correctly
- [ ] Verify no horizontal scrolling on any page

### 10. Edge Cases

- [ ] Create task with very long title (200 chars)
- [ ] Create task with no due date → No countdown shown
- [ ] Create task with special characters in title: `<>&"'`
- [ ] View page with 0 tasks → See "No TODOs yet" message
- [ ] Try to access non-existent task by ID → See 404 or error

---

## Browser Testing

Test in the following browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Accessibility Testing

### Keyboard Navigation

- [ ] Press Tab → Skip link appears
- [ ] Press Enter on skip link → Jump to main content
- [ ] Tab through all interactive elements
- [ ] Verify all buttons/links can be activated with Enter/Space
- [ ] Verify focus indicators visible on all elements

### Screen Reader

- [ ] Run with screen reader (VoiceOver/NVDA)
- [ ] Verify all images have alt text or aria-labels
- [ ] Verify form labels are announced
- [ ] Verify button purposes are clear
- [ ] Verify task status is announced

---

## Expected Results

### ✅ Pass Criteria

- All CRUD operations work correctly
- No console errors in browser DevTools
- UI is responsive and functional on mobile
- Countdown timer displays and updates
- Task sorting works correctly
- Messages display for all actions
- No data loss or corruption

### ❌ Fail Criteria

- Cannot create/edit/delete tasks
- Console errors appear
- UI breaks on mobile
- Data not persisting
- JavaScript errors prevent functionality
- Accessibility barriers present

---

## Testing Notes

**Environment:**

- Django server running at http://127.0.0.1:8000/
- Python 3.9+
- SQLite database
- Timezone: EST (America/New_York)

**Reset Database for Testing:**

```bash
python manage.py shell -c "from myapp.models import Todo; Todo.objects.all().delete()"
```

**Check for JavaScript Errors:**

- Open browser DevTools (F12)
- Go to Console tab
- Look for red error messages

---

## Test Results Template

**Date:** ******\_\_\_******  
**Tester:** ******\_\_\_******  
**Browser:** ******\_\_\_******

| Test Case          | Status            | Notes |
| ------------------ | ----------------- | ----- |
| Create Task        | ⬜ Pass / ⬜ Fail |       |
| View Tasks         | ⬜ Pass / ⬜ Fail |       |
| Edit Task          | ⬜ Pass / ⬜ Fail |       |
| Complete Task      | ⬜ Pass / ⬜ Fail |       |
| Delete Task        | ⬜ Pass / ⬜ Fail |       |
| Due Date/Countdown | ⬜ Pass / ⬜ Fail |       |
| Task Sorting       | ⬜ Pass / ⬜ Fail |       |
| Mobile Responsive  | ⬜ Pass / ⬜ Fail |       |
| Accessibility      | ⬜ Pass / ⬜ Fail |       |

**Overall Result:** ⬜ Pass / ⬜ Fail  
**Issues Found:** ****************\_****************
