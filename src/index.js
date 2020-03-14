const path = require('path')
const http = require("http")
const express = require("express")
const Filter = require("bad-words")
const {generateMessage, generateLocationMessage} = require("./utils/messages")
const {addUser, removeUser, getUser, getUsersListInRoom } = require("./utils/users")

const socketio = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))

app.get('',(req,res) => {
    res.render('index')
})
let count = 0
io.on("connection", (socket) => {
    console.log("new server connection")

    // socket.emit("countUpdated", count)
    // socket.on("increment", () => {
    //     count++
    //     io.emit("countUpdated", count)
    // })

    socket.on("join", (options,callback) => {

        const {error, user} = addUser({id: socket.id, ...options})
        if(error){
            return callback(error)
        }

        socket.join(user.room)
        socket.emit("message", generateMessage('Admin',`Welcome ${user.username} !`))
        socket.broadcast.to(user.room).emit("message", generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit("roomData",{
            room : user.room,
            users : getUsersListInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(msg, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(msg)){
           return callback("profanity is not allowed")
        }
        io.to(user.room).emit("message", generateMessage(user.username, msg))
        callback()
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit("message", generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit("roomData",{
                room : user.room,
                users : getUsersListInRoom(user.room)
            })
        }
        
    })

    socket.on("sendLocation", ({latitude,longitude},callback) =>{
        const user = getUser(socket.id)
        io.to(user.room).emit("locationMessage",generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
        callback("Location shared!")
    })
})
server.listen(port,() => {
    console.log('server is up on port ' + port)
})