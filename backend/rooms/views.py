from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from django.contrib.auth import get_user_model
from .models import Room, RoomUser
from .serializers import RoomSerializer, RoomUserSerializer
from .exceptions import RoomFullException

User = get_user_model()

class AddUserToRoom(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data
        room_hash = data.get("room_hash")
        target_email = data.get("email")

        if not target_email or not room_hash:
            return Response({"error": "Missing email or room_hash"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            room = Room.objects.get(room_hash=room_hash)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            target_user = User.objects.get(email=target_email)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            current_room_user = RoomUser.objects.get(user=user, room=room)
            if not current_room_user.privileges.add_users:
                return Response({"error": "Not enough privilege for this action"}, status=status.HTTP_403_FORBIDDEN)
        except RoomUser.DoesNotExist:
            return Response({"error": "You are not part of this room"}, status=status.HTTP_403_FORBIDDEN)

        try:
            new_room_user = room.add_user(target_user)
        except RoomFullException as e:
            return Response(
                {"error": "room_full", "detail": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except:
            return Response({"error": "something went wrong while adding the user"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "User added successfully", "user": RoomUserSerializer(new_room_user).data}, status=status.HTTP_201_CREATED)

class CreateRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        movie_id = data.get("movie_id")
        is_private = data.get("is_private", True)
        password = data.get("password", None)
        max_users = data.get("max_users", 8)

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

        # RoomUser.objects.create(room=room, user=user)

        serializer = RoomSerializer(room)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
