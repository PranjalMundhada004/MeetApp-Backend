const { Server } = require("socket.io")

const io = new Server(8000, {
    cors: true,
});

//This object maintains a mapping between room IDs and arrays of user socket IDs.
const users = {};

//This object is used to map each socket ID to the room ID it belongs to.
const socketToRoom = {};

// This object is used to map each socket ID to the user name.
const socketIdToUserNameMap = {};

function generateRandomSocketId(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

io.on('connection', (socket) => {

    socket.on("join room", ({ roomId, userName, isAdmin, screen }) => {
        if(screen) {
        //     const virtualUserId = generateRandomSocketId(20);
        //         users[roomId].push(virtualUserId);
        //         socketToRoom[virtualUserId] = roomId;
        //         socketIdToUserNameMap[virtualUserId] = "VirtualUser";
        } 
            if (users[roomId]) {  //check if room exists
                if (!users[roomId].includes(socket.id)) {  //check if user is not in room already
                    users[roomId].push(socket.id);
                }
            } else {
                users[roomId] = [socket.id]; //making new room and adding socketId
            }
            socketToRoom[socket.id] = roomId; //sets roomId as value of current socket.id
            socketIdToUserNameMap[socket.id] = userName; // Maps socket ID to user name
    
            // Check if the user is admin and if there is no virtual user already created for this room
            // if (isAdmin && !users[roomId].some(id => socketIdToUserNameMap[id] === "VirtualUser")) {
            //     const virtualUserId = generateRandomSocketId(20);
            //     users[roomId].push(virtualUserId);
            //     socketToRoom[virtualUserId] = roomId;
            //     socketIdToUserNameMap[virtualUserId] = "VirtualUser";
            // }
            console.log(users);
            console.log(socketToRoom);
            console.log(socketIdToUserNameMap);
    
            //filtering out the current user and sending userId of all other users in room
            // const usersId = users[roomId].filter(id => id !== socket.id);
            const otherUsersInRoom = users[roomId].filter(id => id !== socket.id).map(id => ({ userId: id, userName: socketIdToUserNameMap[id] }));
            socket.emit("all users", { otherUsersInRoom });
    
    });     

    socket.on("sending signal", payload => {
        if(payload.screen) {
            io.to(payload.userToSignal).emit("user joined(screen)", { signal: payload.signal, callerID: payload.callerID, callerName: payload.callerName });
        } else {
            io.to(payload.userToSignal).emit("user joined", { signal: payload.signal, callerID: payload.callerID, callerName: payload.callerName });
        }
    });

    socket.on("returning signal", payload => { //send this signal to the person who joined the room
        io.to(payload.callerID).emit("receiving returned signal", { signal: payload.signal, id: socket.id });
    });

    //sending message
    socket.on("user-message", ({ message, time, userName }) => {
        io.emit("message", { message, time, userName });
    });

    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        if (roomID && users[roomID]) {
            //remove the disconnected user from room
            users[roomID] = users[roomID].filter(id => id !== socket.id);
            if (users[roomID].length === 0) {
                delete users[roomID]; //delete room if there is no person in room
            }
        }
        delete socketToRoom[socket.id]; //delete socketId and room connection
        delete socketIdToUserNameMap[socket.id]; // Remove the user name mapping
        io.emit('user left', socket.id);
    });

});