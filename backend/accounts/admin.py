from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django import forms
from .models import User

# Custom form for changing users
class UserChangeForm(forms.ModelForm):

    class Meta:
        model = User
        fields = (
            "email",
            "username",
            "password",
            "is_active",
            "is_staff",
            "is_superuser",
            "is_guest",
            "groups",
            "user_permissions"
        )

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserChangeForm

    list_display = (
        "id",
        "email",
        "username",
        "avatar",
        "is_guest",
        "is_active",
        "is_staff",
    )
    list_filter = (
        "is_guest",
        "is_staff",
        "is_active",
    )
    ordering = ("email",)
    search_fields = ("email", "username")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {
            "fields": ("username",)
        }),
        ("Permissions", {
            "fields": (
                "is_verified",
                "is_active",
                "is_staff",
                "is_superuser",
                "is_guest",
                "groups",
                "user_permissions"
            )
        }),
        # ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email",
                "username",
                "password1",
                "password2",
                "is_active",
                "is_staff",
                "is_superuser",
                "is_guest"
            ),
        }),
    )
