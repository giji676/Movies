import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import Room, RoomUser

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user", AnonymousUser())
        if self.user.is_anonymous:
            await self.close()
            return

        self.room_hash = self.scope["url_route"]["kwargs"].get("room_hash")
        self.room = await self.get_room(self.room_hash)
        if not self.room:
            await self.close()
            return

        self.room_user = await self.get_room_user(self.room, self.user)
        if not self.room_user:
            await self.close()
            return

        self.privileges = await self.get_privileges(self.room_user)

        self.room_group_name = f"room_{self.room_hash}"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )
        if hasattr(self, "room_user") and self.room_user:
            await self.set_user_watching(False)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")
        action_state = data.get("action_state")

        if not await self.can_perform_action(action):
            await self.send(json.dumps({"error": "Not allowed"}))
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "room_action",
                "action": action,
                "action_state": action_state,
                "sender_channel": self.channel_name,
            }
        )

    async def room_action(self, event):
        if event["sender_channel"] == self.channel_name:
            return

        await self.send(text_data=json.dumps({
            "type": "room_action",
            "action": event["action"],
            "action_state": event["action_state"],
        }))

    # Database helpers (async)

    @database_sync_to_async
    def get_room(self, room_hash):
        try:
            return Room.objects.get(room_hash=room_hash)
        except Room.DoesNotExist:
            return None

    @database_sync_to_async
    def get_room_user(self, room, user):
        try:
            return RoomUser.objects.get(room=room, user=user)
        except RoomUser.DoesNotExist:
            return None

    @database_sync_to_async
    def set_user_watching(self, is_watching):
        self.room_user.is_watching = is_watching
        self.room_user.save()

    @database_sync_to_async
    def get_privileges(self, room_user):
        privileges = room_user.privileges
        return {
            "play_pause": privileges.play_pause,
            "choose_movie": privileges.choose_movie,
            "add_users": privileges.add_users,
            "remove_users": privileges.remove_users,
            "change_privileges": privileges.change_privileges,
        }

    @database_sync_to_async
    def can_perform_action(self, action):
        mapping = {
            "playing": "play_pause",
            "seek": "play_pause",
            "sync": "play_pause",
            "choose_movie": "choose_movie",
            "add_users": "add_users",
            "remove_users": "remove_users",
            "change_privileges": "change_privileges",
        }
        attr = mapping.get(action)
        if attr:
            return getattr(self.room_user.privileges, attr, False)
        return False
