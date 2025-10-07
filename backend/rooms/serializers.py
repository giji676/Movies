from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Room, RoomUser

User = get_user_model()

class RoomSerializer(serializers.ModelSerializer):
    password_hash = serializers.CharField(write_only=True, required=False)
    users = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            "movie_id",
            "created_by",
            "created_at",
            "room_hash",
            "is_active",
            "is_private",
            "password_hash",
            "current_timestamp",
            "max_users",
            "users"
        ]
        read_only_fields = ["room_hash", "created_at"]

    def get_users(self, obj):
        room_users = RoomUser.objects.filter(room=obj)
        return RoomUserSerializer(room_users, many=True).data

class RoomUserSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    room_hash = serializers.CharField(source="room.room_hash", read_only=True)

    class Meta:
        model = RoomUser

        fields = [
            "id",
            "room",
            "room_hash",
            "user",
            "user_email",
            "privileges",
            "joined_at",
            "last_watched_timestamp",
            "is_watching",
        ]
        read_only_fields = ["joined_at", "user_email", "room_hash"]

