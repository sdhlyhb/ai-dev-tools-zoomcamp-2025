"""
Unit tests for views.
"""
from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from myapp.models import Todo


class TodoListViewTest(TestCase):
    """Test cases for todo_list view."""

    def setUp(self):
        """Set up test client and sample data."""
        self.client = Client()
        self.url = reverse('todo_list')

    def test_todo_list_view_status_code(self):
        """Test that todo_list view returns 200."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    def test_todo_list_view_uses_correct_template(self):
        """Test that todo_list uses the correct template."""
        response = self.client.get(self.url)
        self.assertTemplateUsed(response, 'myapp/todo_list.html')

    def test_todo_list_view_context(self):
        """Test that view provides correct context."""
        response = self.client.get(self.url)
        self.assertIn('todos', response.context)
        self.assertIn('total_count', response.context)
        self.assertIn('resolved_count', response.context)
        self.assertIn('pending_count', response.context)

    def test_todo_list_shows_todos(self):
        """Test that todos are displayed in the list."""
        todo = Todo.objects.create(title="Test Todo")
        response = self.client.get(self.url)
        self.assertContains(response, "Test Todo")

    def test_todo_list_empty(self):
        """Test todo_list view with no todos."""
        response = self.client.get(self.url)
        self.assertEqual(response.context['total_count'], 0)
        self.assertContains(response, "No TODOs yet!")

    def test_todo_list_statistics(self):
        """Test that statistics are calculated correctly."""
        Todo.objects.create(title="Todo 1", is_resolved=True)
        Todo.objects.create(title="Todo 2", is_resolved=False)
        Todo.objects.create(title="Todo 3", is_resolved=False)
        
        response = self.client.get(self.url)
        self.assertEqual(response.context['total_count'], 3)
        self.assertEqual(response.context['resolved_count'], 1)
        self.assertEqual(response.context['pending_count'], 2)

    def test_todo_list_sorting(self):
        """Test that todos are sorted by due_date."""
        todo1 = Todo.objects.create(
            title="Later",
            due_date=timezone.now() + timedelta(days=3)
        )
        todo2 = Todo.objects.create(
            title="Earlier",
            due_date=timezone.now() + timedelta(days=1)
        )
        
        response = self.client.get(self.url)
        todos = list(response.context['todos'])
        self.assertEqual(todos[0].title, "Earlier")
        self.assertEqual(todos[1].title, "Later")


class TodoCreateViewTest(TestCase):
    """Test cases for todo_create view."""

    def setUp(self):
        """Set up test client."""
        self.client = Client()
        self.url = reverse('todo_create')

    def test_todo_create_view_get(self):
        """Test GET request to create view."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'myapp/todo_form.html')

    def test_todo_create_view_post_valid(self):
        """Test POST request with valid data creates todo."""
        data = {'title': 'New Todo'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 302)  # Redirect
        self.assertEqual(Todo.objects.count(), 1)
        self.assertEqual(Todo.objects.first().title, 'New Todo')

    def test_todo_create_view_post_invalid(self):
        """Test POST request with invalid data."""
        data = {'title': ''}  # Empty title
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, 200)  # Re-renders form
        self.assertEqual(Todo.objects.count(), 0)

    def test_todo_create_redirect(self):
        """Test that create view redirects to list after success."""
        data = {'title': 'New Todo'}
        response = self.client.post(self.url, data)
        self.assertRedirects(response, reverse('todo_list'))

    def test_todo_create_success_message(self):
        """Test that success message is displayed."""
        data = {'title': 'New Todo'}
        response = self.client.post(self.url, data, follow=True)
        messages = list(response.context['messages'])
        self.assertEqual(len(messages), 1)
        self.assertIn('created successfully', str(messages[0]))


class TodoEditViewTest(TestCase):
    """Test cases for todo_edit view."""

    def setUp(self):
        """Set up test client and sample todo."""
        self.client = Client()
        self.todo = Todo.objects.create(title="Original Title")
        self.url = reverse('todo_edit', args=[self.todo.pk])

    def test_todo_edit_view_get(self):
        """Test GET request to edit view."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'myapp/todo_form.html')

    def test_todo_edit_view_404(self):
        """Test edit view returns 404 for non-existent todo."""
        url = reverse('todo_edit', args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)

    def test_todo_edit_view_post_valid(self):
        """Test POST request with valid data updates todo."""
        data = {'title': 'Updated Title'}
        response = self.client.post(self.url, data)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.title, 'Updated Title')
        self.assertRedirects(response, reverse('todo_list'))

    def test_todo_edit_updates_timestamp(self):
        """Test that editing updates the updated_at timestamp."""
        original_updated = self.todo.updated_at
        data = {'title': 'Updated Title'}
        self.client.post(self.url, data)
        self.todo.refresh_from_db()
        self.assertGreater(self.todo.updated_at, original_updated)


class TodoDeleteViewTest(TestCase):
    """Test cases for todo_delete view."""

    def setUp(self):
        """Set up test client and sample todo."""
        self.client = Client()
        self.todo = Todo.objects.create(title="To Delete")
        self.url = reverse('todo_delete', args=[self.todo.pk])

    def test_todo_delete_view_get(self):
        """Test GET request shows confirmation page."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'myapp/todo_confirm_delete.html')

    def test_todo_delete_view_post(self):
        """Test POST request deletes todo."""
        response = self.client.post(self.url)
        self.assertEqual(Todo.objects.count(), 0)
        self.assertRedirects(response, reverse('todo_list'))

    def test_todo_delete_view_404(self):
        """Test delete view returns 404 for non-existent todo."""
        url = reverse('todo_delete', args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 404)


class TodoToggleResolvedViewTest(TestCase):
    """Test cases for todo_toggle_resolved view."""

    def setUp(self):
        """Set up test client and sample todo."""
        self.client = Client()
        self.todo = Todo.objects.create(title="Test Todo", is_resolved=False)
        self.url = reverse('todo_toggle_resolved', args=[self.todo.pk])

    def test_toggle_resolved_marks_complete(self):
        """Test toggling unresolved todo to resolved."""
        response = self.client.post(self.url)
        self.todo.refresh_from_db()
        self.assertTrue(self.todo.is_resolved)
        self.assertRedirects(response, reverse('todo_list'))

    def test_toggle_resolved_marks_incomplete(self):
        """Test toggling resolved todo to unresolved."""
        self.todo.is_resolved = True
        self.todo.save()
        response = self.client.post(self.url)
        self.todo.refresh_from_db()
        self.assertFalse(self.todo.is_resolved)

    def test_toggle_resolved_404(self):
        """Test toggle returns 404 for non-existent todo."""
        url = reverse('todo_toggle_resolved', args=[9999])
        response = self.client.post(url)
        self.assertEqual(response.status_code, 404)
