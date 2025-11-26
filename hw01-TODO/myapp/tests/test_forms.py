"""
Unit tests for TodoForm.
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from myapp.forms import TodoForm


class TodoFormTest(TestCase):
    """Test cases for the TodoForm."""

    def test_valid_form_with_all_fields(self):
        """Test form is valid with all fields filled."""
        form_data = {
            'title': 'Test Task',
            'description': 'Test description',
            'due_date': timezone.now() + timedelta(days=1)
        }
        form = TodoForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_valid_form_with_only_title(self):
        """Test form is valid with only title."""
        form_data = {'title': 'Test Task'}
        form = TodoForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_invalid_form_without_title(self):
        """Test form is invalid without title."""
        form_data = {
            'description': 'Test description',
            'due_date': timezone.now() + timedelta(days=1)
        }
        form = TodoForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('title', form.errors)

    def test_invalid_form_with_empty_title(self):
        """Test form is invalid with empty title."""
        form_data = {'title': ''}
        form = TodoForm(data=form_data)
        self.assertFalse(form.is_valid())

    def test_form_title_max_length(self):
        """Test form validates title max length."""
        # Title should be max 200 characters
        long_title = 'x' * 201
        form_data = {'title': long_title}
        form = TodoForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn('title', form.errors)

    def test_form_with_valid_title_length(self):
        """Test form accepts title at max length."""
        valid_title = 'x' * 200
        form_data = {'title': valid_title}
        form = TodoForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_form_fields_present(self):
        """Test that form has all expected fields."""
        form = TodoForm()
        self.assertIn('title', form.fields)
        self.assertIn('description', form.fields)
        self.assertIn('due_date', form.fields)

    def test_form_due_date_widget(self):
        """Test that due_date field uses datetime-local widget."""
        form = TodoForm()
        widget_type = form.fields['due_date'].widget.__class__.__name__
        self.assertEqual(widget_type, 'DateTimeInput')

    def test_form_saves_correctly(self):
        """Test that form saves data correctly."""
        due_date = timezone.now() + timedelta(days=1)
        form_data = {
            'title': 'Test Task',
            'description': 'Test description',
            'due_date': due_date
        }
        form = TodoForm(data=form_data)
        self.assertTrue(form.is_valid())
        todo = form.save()
        self.assertEqual(todo.title, 'Test Task')
        self.assertEqual(todo.description, 'Test description')
        self.assertIsNotNone(todo.due_date)

    def test_form_optional_fields(self):
        """Test that description and due_date are optional."""
        form = TodoForm()
        self.assertFalse(form.fields['description'].required)
        self.assertFalse(form.fields['due_date'].required)

    def test_form_with_special_characters(self):
        """Test form handles special characters in title."""
        form_data = {'title': 'Test <>&"\''}
        form = TodoForm(data=form_data)
        self.assertTrue(form.is_valid())
