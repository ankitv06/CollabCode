import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'

const wss = new WebSocketServer({ port: 1234 })

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req)
  console.log('Yjs client connected')
})

console.log('y-websocket server running on port 1234')
