class RoomFullException(Exception):
    def __init__(self, message="The room is full"):
        self.message = message
        super().__init__(self.message)
