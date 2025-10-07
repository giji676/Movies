from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from django.contrib.auth import get_user_model
from .models import Room, RoomUser
from .serializers import RoomSerializer, RoomUserSerializer
from .exceptions import RoomFullException

User = get_user_model()

class JoinRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_hash):
        try:
            room = Room.objects.get(room_hash=room_hash)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            room_user = room.add_user(request.user)
        except RoomFullException as e:
            return Response(
                {"error": "room_full", "detail": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            "message": "Joined room successfully",
            "user": RoomUserSerializer(room_user).data
        }, status=status.HTTP_201_CREATED)

class ManagerUsersInRoom(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, room_hash, user_id):
        try:
            room = Room.objects.get(room_hash=room_hash)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            room_user = RoomUser.objects.get(user__id=user_id, room=room)
        except RoomUser.DoesNotExist:
            return Response({"error": "Target user not in room"}, status=status.HTTP_404_NOT_FOUND)

        try:
            request_room_user = RoomUser.objects.get(user=request.user, room=room)
            if not request_room_user.privileges.change_privileges:
                return Response({"error": "Not enough privilege for this action"}, status=status.HTTP_403_FORBIDDEN)
        except RoomUser.DoesNotExist:
            return Response({"error": "You are not in this room"}, status=status.HTTP_403_FORBIDDEN)

        allowed_fields = ["play_pause", "choose_movie", "add_users", "remove_users", "change_privileges"]
        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        if not data:
            return Response({"error": "No valid privilege fields provided"}, status=status.HTTP_400_BAD_REQUEST)

        for key, value in data.items():
            setattr(room_user.privileges, key, value)

        room_user.privileges.save()

        return Response({
            "message": "Privileges updated successfully",
            "user": RoomUserSerializer(room_user).data
        }, status=status.HTTP_200_OK)

    def delete(self, request, room_hash, user_id):
        try:
            room = Room.objects.get(room_hash=room_hash)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            room_user = RoomUser.objects.get(user__id=user_id, room=room)
            target_user = room_user.user
        except RoomUser.DoesNotExist:
            return Response({"error": "Target user not in room"}, status=status.HTTP_404_NOT_FOUND)

        try:
            current_room_user = RoomUser.objects.get(user=request.user, room=room)
            if not current_room_user.privileges.remove_users:
                return Response({"error": "Not enough privilege for this action"}, status=status.HTTP_403_FORBIDDEN)
        except RoomUser.DoesNotExist:
            return Response({"error": "You are not in this room"}, status=status.HTTP_403_FORBIDDEN)

        room_user.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    def post(self, request, room_hash):
        user = request.user
        data = request.data
        target_email = data.get("email")

        if not target_email:
            return Response({"error": "Missing email"}, status=status.HTTP_400_BAD_REQUEST)

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
