from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from django.contrib.auth import get_user_model
from .models import Room, RoomUser
from .serializers import RoomSerializer, RoomUserSerializer

User = get_user_model()

class RoomView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"test": "testeste"})

class CreateRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        movie_id = data.get("movie_id")
        is_private = data.get("is_private", True)
        password = data.get("password", None)
        max_users = data.get("max_users", 8)
        whitelisted_users_ids = data.get("whitelisted_users", [])

        if whitelisted_users_ids is None:
            whitelisted_users_ids = []
        elif isinstance(whitelisted_users_ids, str):
            whitelisted_users_ids = [int(whitelisted_users_ids)]
        else:
            whitelisted_users_ids = [int(uid) for uid in whitelisted_users_ids]

        if not movie_id:
            return Response({"error": "movie_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        room = Room(
            movie_id=movie_id,
            created_by=user,
            is_private=is_private,
            max_users=max_users
        )

        if password:
            room.set_password(password)
        room.save()

        try:
            if whitelisted_users_ids:
                for user_id in whitelisted_users_ids:
                    user_obj = User.objects.get(id=user_id)
                    room.whitelisted_users.add(user_obj)
        except:
            return Response({"error": "invalid list of whitelisted users"}, status=status.HTTP_400_BAD_REQUEST)

        RoomUser.objects.create(room=room, user=user, role="owner")

        serializer = RoomSerializer(room)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
