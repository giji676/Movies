import json
from datetime import datetime, timezone
from channels.generic.websocket import AsyncWebsocketConsumer
from utils.redisClient import redis_client  # import the connection

class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # self.room_group_name = f"room_{self.scope['url_route']['kwargs']['room_id']}"
        self.room_group_name = f"room_123"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Fetch the current room state from Redis
        state = redis_client.hgetall(self.room_group_name)
        print("Raw Redis state:", state)

        if not state:
            print("No state yet, initializing...")
            redis_client.hset(self.room_group_name, mapping={
                "timestamp": 0.0,
                "last_updated": datetime.utcnow().isoformat()
            })
            state = redis_client.hgetall(self.room_group_name)

        last_timestamp = float(state["timestamp"])
        last_update = datetime.fromisoformat(state["last_updated"])  # naive
        diff = (datetime.utcnow() - last_update).total_seconds()
        current_timestamp = last_timestamp + diff

        await self.send(json.dumps({
            "type": "sync",
            "timestamp": current_timestamp,
            "last_updated": state["last_updated"],
        }))

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data["action"]

        # Example: creator sends an update
        if action == "sync_update":
            timestamp = data["timestamp"]
            last_updated = datetime.utcnow().isoformat()

            # Store in Redis hash
            redis_client.hset(
                self.room_group_name,
                mapping={
                    "timestamp": timestamp,
                    "last_updated": last_updated,
                },
            )

            # Broadcast to others
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "sync_update",
                    "timestamp": timestamp,
                    "last_updated": last_updated,
                    "sender": self.channel_name,
                },
            )

    async def sync_update(self, event):
        if event["sender"] == self.channel_name:
            return
        await self.send(json.dumps({
            "type": "sync_update",
            "timestamp": event["timestamp"],
            "last_updated": event["last_updated"],
        }))
