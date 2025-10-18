import json
from datetime import datetime, timezone
from channels.generic.websocket import AsyncWebsocketConsumer
from utils.redisClient import redis_client

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_hash = f"room_{self.scope['url_route']['kwargs']['room_hash']}"
        await self.channel_layer.group_add(self.room_group_hash, self.channel_name)
        await self.accept()

        # Fetch current state from Redis
        state = redis_client.hgetall(self.room_group_hash)
        if not state:
            # Initialize default state
            redis_client.hset(self.room_group_hash, mapping={
                "timestamp": 60.0,
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "play_state": "False"
            })
            state = redis_client.hgetall(self.room_group_hash)

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
        state = redis_client.hgetall(self.room_group_hash)
        timestamp = float(state.get("timestamp", 0.0))
        last_updated = datetime.fromisoformat(state.get("last_updated", datetime.now(timezone.utc).isoformat()))
        play_state = state.get("play_state", "False") == "True"

        # Update server state
        if action_type == "seek":
            timestamp = float(action_state)
        elif action_type == "play_state":
            play_state = bool(action_state)
        last_updated = datetime.now(timezone.utc)

        # Save updated state back to Redis
        redis_client.hset(self.room_group_hash, mapping={
            "timestamp": timestamp,
            "last_updated": last_updated.isoformat(),
            "play_state": str(play_state)
        })

        # Broadcast updated state to all clients
        await self.channel_layer.group_send(
            self.room_group_hash,
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
