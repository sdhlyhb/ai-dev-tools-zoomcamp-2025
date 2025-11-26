from django.db import models
from django.utils import timezone


class Todo(models.Model):
    """
    Model representing a TODO item.
    """
    title = models.CharField(max_length=200, help_text="Title of the TODO item")
    description = models.TextField(blank=True, help_text="Detailed description of the TODO")
    due_date = models.DateTimeField(null=True, blank=True, help_text="Due date for the TODO")
    is_resolved = models.BooleanField(default=False, help_text="Whether the TODO is completed")
    created_at = models.DateTimeField(auto_now_add=True, help_text="When the TODO was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="When the TODO was last updated")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "TODO"
        verbose_name_plural = "TODOs"
    
    def __str__(self):
        return self.title
    
    def is_overdue(self):
        """Check if the TODO is overdue."""
        if self.due_date and not self.is_resolved:
            return timezone.now() > self.due_date
        return False
