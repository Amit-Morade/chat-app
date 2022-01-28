const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const { generateMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const pathToPublic = path.join(__dirname, "../public")

const app = express()
const server = http.createServer(app);

const io = socketio(server)

io.on('connection', (socket) => {
    console.log('user connected successfully')

    socket.on('join', ({username, room}, callback) => {
        const {error, user} = addUser({ id: socket.id, username, room })
        if(error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage("Admin", "Welcome!"))
        socket.broadcast.to(user.room).emit('message', generateMessage("Admin", `${user.username} has joined`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage(user.username, msg))
        }

        callback()
    })

    socket.on('sendLocation', (position, callback) => {
        io.emit('locationMessage', `https://google.com/maps?q=${position.latitude},${position.longitude}`)
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessage("Admin", `${user.username} has left room`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

app.use(express.static(pathToPublic))

const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log('server is running')
})