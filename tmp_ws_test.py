import asyncio
import websockets

async def main():
    try:
        async with websockets.connect('ws://127.0.0.1:3000/ws/chat') as ws:
            print('connected')
            await ws.send('hello')
            print('sent')
            await ws.close()
    except Exception as e:
        print(type(e).__name__, e)

asyncio.run(main())
