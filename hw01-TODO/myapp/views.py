from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from .models import Todo
from .forms import TodoForm


def todo_list(request):
    """Display all TODO items sorted by due date."""
    todos = Todo.objects.all().order_by('due_date', 'created_at')
    context = {
        'todos': todos,
        'now': timezone.now(),
        'total_count': todos.count(),
        'resolved_count': todos.filter(is_resolved=True).count(),
        'pending_count': todos.filter(is_resolved=False).count(),
    }
    return render(request, 'myapp/todo_list.html', context)


def todo_create(request):
    """Create a new TODO item."""
    if request.method == 'POST':
        form = TodoForm(request.POST)
        if form.is_valid():
            todo = form.save()
            messages.success(request, f'TODO "{todo.title}" created successfully!')
            return redirect('todo_list')
    else:
        form = TodoForm()
    
    return render(request, 'myapp/todo_form.html', {'form': form, 'action': 'Create'})


def todo_edit(request, pk):
    """Edit an existing TODO item."""
    todo = get_object_or_404(Todo, pk=pk)
    
    if request.method == 'POST':
        form = TodoForm(request.POST, instance=todo)
        if form.is_valid():
            todo = form.save()
            messages.success(request, f'TODO "{todo.title}" updated successfully!')
            return redirect('todo_list')
    else:
        # Format the due_date for the datetime-local input
        initial_data = {}
        if todo.due_date:
            initial_data['due_date'] = todo.due_date.strftime('%Y-%m-%dT%H:%M')
        form = TodoForm(instance=todo, initial=initial_data)
    
    return render(request, 'myapp/todo_form.html', {'form': form, 'action': 'Edit', 'todo': todo})


def todo_delete(request, pk):
    """Delete a TODO item."""
    todo = get_object_or_404(Todo, pk=pk)
    
    if request.method == 'POST':
        title = todo.title
        todo.delete()
        messages.success(request, f'TODO "{title}" deleted successfully!')
        return redirect('todo_list')
    
    return render(request, 'myapp/todo_confirm_delete.html', {'todo': todo})


def todo_toggle_resolved(request, pk):
    """Toggle the resolved status of a TODO item."""
    todo = get_object_or_404(Todo, pk=pk)
    todo.is_resolved = not todo.is_resolved
    todo.save()
    
    status = "resolved" if todo.is_resolved else "unresolved"
    messages.success(request, f'TODO "{todo.title}" marked as {status}!')
    return redirect('todo_list')
