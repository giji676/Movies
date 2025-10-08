import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

class RoomConsumer(WebsocketConsumer):
    def connect(self):
        self.room_group_name = "test"
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name,
        )
        self.accept()

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json["action"]
        action_state = text_data_json["action_state"]

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "room_action",
                "action": action,
                "action_state": action_state,
                "sender_channel": self.channel_name,
            }
        )

    def room_action(self, event):
        if event.get("sender_channel") == self.channel_name:
            return

        self.send(text_data=json.dumps({
            "type": "room_action",
            "action": event["action"],
            "action_state": event["action_state"],
        }))
