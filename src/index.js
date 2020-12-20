const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMsg, generateLocationMsg} = require('./utils/messages');
const {addUser, removeUser, getUserById, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname,'../public');

app.use(express.static(publicDirectoryPath));


io.on('connection', (socket)=> {
  

    socket.on('join', ({username, room}, callback)=> {
        const {error, user} = addUser({id: socket.id, username, room});

        if(error){
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMsg('Admin','Welcome!'));

        socket.broadcast.to(user.room).emit('message', generateMsg('Admin', `${user.username} has joined!`));

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
        });

    
    socket.on('sendMessage', (msg, callback)=> {
        const room = getUserById(socket.id).room;
        const username = getUserById(socket.id).username;
        const filter = new Filter();
        if (filter.isProfane(msg)){
            return callback('Error! msg not allowed!');
        }

        io.to(room).emit('message', generateMsg(username, msg));
        callback();
    });

    socket.on('disconnect', ()=> {
       const user = removeUser(socket.id);
       if (user){
           io.to(user.room).emit('message', generateMsg('Admin', `${user.username} has left...`));
           io.to(user.room).emit('roomData', {
               room: user.room,
               users: getUsersInRoom(user.room)
           })
        }

        });

    socket.on('sendLocation',(location, callback)=> {
        const room = getUserById(socket.id).room;
        const username = getUserById(socket.id).username;
        io.to(room).emit('locationMessage', generateLocationMsg(username, `https://google.com/maps?q=${location.lat},${location.long}`));
        callback();
    })
});

server.listen(port, ()=> {
    console.log('server is up on port ' + port);
})
