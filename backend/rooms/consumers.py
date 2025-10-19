import json
from datetime import datetime, timezone
from channels.generic.websocket import AsyncWebsocketConsumer
from utils.redisClient import redis_client
from utils import customStatus
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from rooms.models import Room, RoomUser, RoomUserPrivileges

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_hash = f"{self.scope['url_route']['kwargs']['room_hash']}"
        self.group_name = f"room_{self.room_hash}"
        self.user = self.scope["user"]

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        if self.user.is_anonymous:
            await self.close(code=customStatus.WS_4001_UNAUTHORISED)
            return

        try:
            self.room = await database_sync_to_async(Room.objects.get)(
                room_hash=self.room_hash
            )
            self.room_user= await database_sync_to_async(RoomUser.objects.get)(
                room=self.room, user=self.user
            )
            self.privileges = await database_sync_to_async(RoomUserPrivileges.objects.get)(
                pk=self.room_user.privileges_id
            )
        except ObjectDoesNotExist:
            await self.close(code=customStatus.WS_4003_FORBIDDEN)
            return

        # Fetch current state from Redis
        state = redis_client.hgetall(self.group_name)
        if not state:
            # Initialize default state
            redis_client.hset(self.group_name, mapping={
                "timestamp": 0.0,
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "play_state": "True"
            })
            state = redis_client.hgetall(self.group_name)

        timestamp = float(state["timestamp"])
        last_updated = datetime.fromisoformat(state["last_updated"])
        play_state = state.get("play_state") == "True"

        # Calculate live timestamp
        diff = (datetime.now(timezone.utc) - last_updated).total_seconds()
        current_timestamp = timestamp + diff if play_state else timestamp

        await self.send(json.dumps({
            "type": "room_update",
            "timestamp": current_timestamp,
            "last_updated": state["last_updated"],
            "play_state": play_state
        }))

    async def receive(self, text_data):
        data = json.loads(text_data)
        action_type = data.get("action_type")
        action_state = data.get("action_state")

        # Fetch current state
        state = redis_client.hgetall(self.group_name)
        timestamp = float(state.get("timestamp", 0.0))
        last_updated = datetime.fromisoformat(
            state.get("last_updated", datetime.now(timezone.utc).isoformat())
        )
        play_state = state.get("play_state", "False") == "True"

        now = datetime.now(timezone.utc)

        # Update server state based on action
        if (self.privileges.play_pause):
            if action_type == "seek":
                timestamp = float(action_state)
                last_updated = now

            elif action_type == "play_state":
                new_play_state = str(action_state).lower() == "true"

                # If user is pausing -> calculate current timestamp
                if play_state and not new_play_state:
                    diff = (now - last_updated).total_seconds()
                    timestamp += diff  # freeze playback position

                # If user is resuming -> just update last_updated
                last_updated = now
                play_state = new_play_state

            # Save updated state
            redis_client.hset(self.group_name, mapping={
                "timestamp": timestamp,
                "last_updated": last_updated.isoformat(),
                "play_state": str(play_state)
            })

            # Broadcast to others
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "room_update",
                    "timestamp": timestamp,
                    "last_updated": last_updated.isoformat(),
                    "play_state": play_state,
                    "sender": self.channel_name
                }
            )

    async def room_update(self, event):
        if event["sender"] == self.channel_name:
            return
        await self.send(json.dumps({
            "type": "room_update",
            "timestamp": event["timestamp"],
            "last_updated": event["last_updated"],
            "play_state": event["play_state"]
        }))
