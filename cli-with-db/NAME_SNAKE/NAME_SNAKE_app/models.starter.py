"""
Models for $${name_snake}.

Add your Django models here.
"""

from __future__ import annotations

from django.db import models


class TimestampedModel(models.Model):
    """Abstract base model with created_at and updated_at fields."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# Example model - replace with your own models
# class Item(TimestampedModel):
#     """An example model."""
#
#     name = models.CharField(max_length=255)
#     description = models.TextField(blank=True)
#
#     def __str__(self):
#         return self.name
