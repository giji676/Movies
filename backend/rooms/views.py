from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from django.contrib.auth import get_user_model
from .models import Room, RoomUser
from .serializers import RoomSerializer, RoomUserSerializer
from .exceptions import RoomFullException

User = get_user_model()

class RoomUserView(APIView):
    permission_classes = [IsAuthenticated]

    """ Return full room user, including privilages """
    def get(self, request, room_hash):
        user = request.user
        try:
            room = Room.objects.get(room_hash=room_hash)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            room_user = RoomUser.objects.get(user=user, room=room)
        except RoomUser.DoesNotExist:
            return Response({"error": "RoomUser not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response({"room_user": RoomUserSerializer(room_user).data}, status=status.HTTP_200_OK)

class ManageRoomView(APIView):
    permission_classes = [IsAuthenticated]

    """
        Partially updates a Room.
        Accepts any Room fields in JSON; optionally, a 'password' can be set or updated.
        Returns the updated Room on success, or an error if not allowed or invalid.
    """
    def patch(self, request, room_hash):
        try:
            room = Room.objects.get(room_hash=room_hash)
        except Room.DoesNotExist:
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)

        if room.created_by != request.user:
            return Response({"error": "Not allowed to modify this room."}, status=status.HTTP_403_FORBIDDEN)

        serializer = RoomSerializer(room, data=request.data, partial=True)

        if serializer.is_valid():
            password = serializer.validated_data.pop("password", None)
            updated_room = serializer.save()
            if password:
                updated_room.set_password(password)
                updated_room.save(update_fields=["password_hash"])

            return Response(RoomSerializer(updated_room).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

        return Response({
            "message": "Joined room successfully",
            "user": RoomUserSerializer(room_user).data,
            "room": RoomSerializer(room).data
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
            current_room_user = RoomUser.objects.get(user=request.user, room=room)
            if not current_room_user.privileges.remove_users:
                return Response({"error": "Not enough privilege for this action"}, status=status.HTTP_403_FORBIDDEN)
        except RoomUser.DoesNotExist:
            return Response({"error": "You are not in this room"}, status=status.HTTP_403_FORBIDDEN)

        room.remove_user(user_id)

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

        return Response({"message": "User added successfully", "user": RoomUserSerializer(new_room_user).data}, status=status.HTTP_201_CREATED)

class CreateRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        is_private = data.get("is_private", True)
        password = data.get("password", None)
        max_users = data.get("max_users", 8)

        room = Room(
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
