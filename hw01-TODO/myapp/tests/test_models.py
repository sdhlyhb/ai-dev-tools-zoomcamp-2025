"""
Unit tests for Todo model.
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from myapp.models import Todo


class TodoModelTest(TestCase):
    """Test cases for the Todo model."""

    def setUp(self):
        """Set up test data."""
        self.todo = Todo.objects.create(
            title="Test Todo",
            description="Test description",
            due_date=timezone.now() + timedelta(days=5)
        )

    def test_todo_creation(self):
        """Test that a todo can be created with all fields."""
        self.assertEqual(self.todo.title, "Test Todo")
        self.assertEqual(self.todo.description, "Test description")
        self.assertFalse(self.todo.is_resolved)
        self.assertIsNotNone(self.todo.created_at)
        self.assertIsNotNone(self.todo.updated_at)

    def test_todo_creation_minimal(self):
        """Test creating todo with only required fields."""
        todo = Todo.objects.create(title="Minimal Todo")
        self.assertEqual(todo.title, "Minimal Todo")
        self.assertEqual(todo.description, "")
        self.assertIsNone(todo.due_date)
        self.assertFalse(todo.is_resolved)

    def test_todo_str_representation(self):
        """Test the string representation of todo."""
        self.assertEqual(str(self.todo), "Test Todo")

    def test_is_overdue_with_no_due_date(self):
        """Test is_overdue returns False when no due date."""
        todo = Todo.objects.create(title="No Due Date")
        self.assertFalse(todo.is_overdue())

    def test_is_overdue_with_future_date(self):
        """Test is_overdue returns False for future due dates."""
        self.assertFalse(self.todo.is_overdue())

    def test_is_overdue_with_past_date(self):
        """Test is_overdue returns True for past due dates."""
        todo = Todo.objects.create(
            title="Overdue Todo",
            due_date=timezone.now() - timedelta(days=1)
        )
        self.assertTrue(todo.is_overdue())

    def test_is_overdue_resolved_task(self):
        """Test is_overdue for resolved tasks with past due dates."""
        todo = Todo.objects.create(
            title="Resolved Overdue",
            due_date=timezone.now() - timedelta(days=1),
            is_resolved=True
        )
        # Resolved tasks are not considered overdue
        self.assertFalse(todo.is_overdue())

    def test_todo_default_values(self):
        """Test default values are set correctly."""
        todo = Todo.objects.create(title="Default Test")
        self.assertFalse(todo.is_resolved)
        self.assertEqual(todo.description, "")
        self.assertIsNone(todo.due_date)

    def test_todo_update_timestamp(self):
        """Test that updated_at changes when todo is modified."""
        original_updated = self.todo.updated_at
        # Small delay to ensure timestamp difference
        import time
        time.sleep(0.01)
        self.todo.title = "Updated Title"
        self.todo.save()
        self.assertNotEqual(self.todo.updated_at, original_updated)
        self.assertGreater(self.todo.updated_at, original_updated)

    def test_title_max_length(self):
        """Test title field max length."""
        max_length = self.todo._meta.get_field('title').max_length
        self.assertEqual(max_length, 200)

    def test_toggle_resolution(self):
        """Test toggling the is_resolved status."""
        self.assertFalse(self.todo.is_resolved)
        self.todo.is_resolved = True
        self.todo.save()
        self.assertTrue(self.todo.is_resolved)
        self.todo.is_resolved = False
        self.todo.save()
        self.assertFalse(self.todo.is_resolved)

    def test_todo_ordering(self):
        """Test todos can be ordered by due_date."""
        todo1 = Todo.objects.create(
            title="First",
            due_date=timezone.now() + timedelta(days=1)
        )
        todo2 = Todo.objects.create(
            title="Second",
            due_date=timezone.now() + timedelta(days=2)
        )
        todo3 = Todo.objects.create(
            title="Third",
            due_date=timezone.now() + timedelta(days=3)
        )
        
        todos = Todo.objects.all().order_by('due_date')
        self.assertEqual(todos[0].title, "First")
        self.assertEqual(todos[1].title, "Second")
        self.assertEqual(todos[2].title, "Third")
