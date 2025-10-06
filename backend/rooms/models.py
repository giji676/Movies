import hashlib
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password

User = get_user_model()

class Room(models.Model):
    movie_id = models.IntegerField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_rooms")
    created_at = models.DateTimeField(auto_now_add=True)
    room_hash = models.CharField(max_length=32, unique=True, editable=False, db_index=True)
    is_active = models.BooleanField(default=True)
    is_private = models.BooleanField(default=True)
    password_hash = models.CharField(max_length=100, blank=True, null=True)
    whitelisted_users = models.ManyToManyField(User, blank=True, related_name="whitelisted_rooms")
    current_timestamp = models.FloatField(default=0.0)
    max_users = models.PositiveIntegerField(default=8)

    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="RoomUser",
        related_name="joined_rooms"
    )

    def add_user(self, user, role="guest"):
        if self.users.filter(id=user.id).exists():
            return RoomUser.objects.get(room=self, user=user)

        normal_user_ids = set(self.users.values_list('id', flat=True))
        whitelisted_user_ids = set(self.whitelisted_users.values_list('id', flat=True))

        all_active_user_ids = normal_user_ids.union(whitelisted_user_ids)

        all_active_user_ids.add(user.id)

        if len(all_active_user_ids) > self.max_users:
            raise ValueError("Room is full")

        room_user, created = RoomUser.objects.get_or_create(
            room=self,
            user=user,
            defaults={"role": role}
        )
        return room_user

    def remove_user(self, user):
        try:
            room_user = RoomUser.objects.get(room=self, user=user)
            room_user.delete()
        except RoomUser.DoesNotExist:
            pass

        # Check if no users left → mark room inactive
        if self.users.count() == 0:
            self.is_active = False
            self.save()

    def save(self, *args, **kwargs):
        if not self.room_hash:
            input_string = f"{self.movie_id}-{self.created_by_id}-{timezone.now().isoformat()}"
            self.room_hash = hashlib.sha256(input_string.encode()).hexdigest()[:12]
        super().save(*args, **kwargs)

    def set_password(self, raw_password):
        if raw_password:
            self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        if not self.password_hash:
            return False
        return check_password(raw_password, self.password_hash)

    def __str__(self):
        return f"Room {self.room_hash} - Movie {self.movie_id}"

class RoomUser(models.Model):
    ROLE_CHOICES = [
        ("owner", "Owner"),
        ("authorized", "Authorized"),
        ("guest", "Guest"),
    ]

    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="guest")
    joined_at = models.DateTimeField(auto_now_add=True)
    last_watched_timestamp = models.FloatField(default=0.0)
    is_watching = models.BooleanField(default=False)

    class Meta:
        unique_together = ("room", "user")

    def __str__(self):
        return f"{self.user} in {self.room} as {self.role}"
