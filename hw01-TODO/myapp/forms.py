from django import forms
from .models import Todo


class TodoForm(forms.ModelForm):
    """Form for creating and editing TODO items."""
    
    due_date = forms.DateTimeField(
        required=False,
        widget=forms.DateTimeInput(attrs={
            'type': 'datetime-local',
            'class': 'form-control'
        }),
        input_formats=['%Y-%m-%dT%H:%M']
    )
    
    class Meta:
        model = Todo
        fields = ['title', 'description', 'due_date', 'is_resolved']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter TODO title'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Enter description (optional)'}),
            'is_resolved': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
