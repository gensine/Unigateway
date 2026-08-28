from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, payload: dict):
        for ws in self.active.copy():
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(ws)

ws_manager = ConnectionManager()
