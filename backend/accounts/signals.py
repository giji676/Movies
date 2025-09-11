from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, UserSettings

@receiver(post_save, sender=CustomUser)
def create_user_settings(sender, instance, created, **kwargs):
    if created:
        UserSettings.objects.create(user=instance)
