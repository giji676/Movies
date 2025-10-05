import json
from channels.generic.websocket import WebsocketConsumer

class RoomConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

        self.send(text_data=json.dumps({
            "type":"connection_established",
            "data":"connected",
        }))

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json["action"]

        self.send(text_data=json.dumps({
            "action": action,
            "res": "say less",
        }))
