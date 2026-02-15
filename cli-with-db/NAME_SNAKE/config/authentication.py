"""
Single-user token authentication for $${name_snake}.

This module provides a simple bearer token authentication mechanism designed
for single-user CLI tools with embedded servers.
"""

from __future__ import annotations

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions


class SingleUserTokenAuthentication(authentication.BaseAuthentication):
    """
    Simple token authentication for single-user operation.

    Expects an Authorization header in the format:
        Authorization: Bearer <token>

    The token is validated against the API_TOKEN setting.
    If valid, returns the first user in the database (or creates one if none exists).
    """

    keyword = "Bearer"

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request)

        if not auth_header:
            return None

        try:
            auth_parts = auth_header.decode("utf-8").split()
        except UnicodeDecodeError:
            msg = "Invalid token header encoding."
            raise exceptions.AuthenticationFailed(msg)

        if len(auth_parts) != 2:
            msg = "Invalid token header format."
            raise exceptions.AuthenticationFailed(msg)

        keyword, token = auth_parts

        if keyword.lower() != self.keyword.lower():
            return None

        return self.authenticate_token(token)

    def authenticate_token(self, token):
        """Validate the token and return the user."""
        expected_token = getattr(settings, "API_TOKEN", "")

        if not expected_token:
            msg = "API_TOKEN is not configured. Set the environment variable."
            raise exceptions.AuthenticationFailed(msg)

        if token != expected_token:
            msg = "Invalid token."
            raise exceptions.AuthenticationFailed(msg)

        # Get or create the single user
        User = get_user_model()
        user = User.objects.first()

        if user is None:
            user = User.objects.create_user(
                username="admin",
                email="admin@localhost",
                password=None,  # No password needed for token auth
            )

        return (user, token)

    def authenticate_header(self, request):
        """Return a string to be used as the value of the WWW-Authenticate header."""
        return self.keyword
