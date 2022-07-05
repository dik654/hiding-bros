var app = require('express')();
var cors = require('cors');
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
const port = process.env.PORT || 3001;
// http server를 socket.io server로 upgrade한다
var io = require('socket.io')(server, {
    cors: {
    origin: "https://dik654.github.io/hiding-bros-game/",
  },
});
const { v4: uuidv4 } = require('uuid');
const { fsyncSync } = require('fs');
const MongoClient = require('mongodb').MongoClient;

// MongoClient.connect('mongoDB 클러스터에서 복사해온 URL',(error, client)=>{
//     if (error) return console.log(error);
//     db = client.db('디비제목'); //4. 클러스터 데이터베이스를 db변수에 저장(cluster-collections-add my own data 의 데이터베이스 제목)
//     app.listen(8080, ()=>{
//       console.log('포트번호 8080 서버접속');
//     });
//   });
// // localhost:3000으로 서버에 접속하면 클라이언트로 index.html을 전송한다
// app.get('/', function(req, res) {
//   res.sendFile(__dirname + '/index-room.html');
// });

const rooms = [];
const roomState = {
    connections: [false, false],
    ready: [false, false],
    playerNickNames: ["아무개", "아무개"],
}

var game = io.of('/game').on('connection', function(socket) {
    //useEffect때문에 새로고침시 socket이 변경되어 방 생성 불가, socket.id만 동일하다고 되는것이 아니였음
    app.post('/roomtext', (req, res) => {
        socket.emit('roomText', req.body.text)  
    });
    socket.on('ready', (data) => {
        if (!rooms[socket.roomId].start) {
            rooms[socket.roomId].roomState.ready[data.pos] = data.ready;
            socket.emit('ready', rooms[socket.roomId].roomState.ready);
            socket.to(socket.roomId).emit('ready', rooms[socket.roomId].roomState.ready);
            if (!(rooms[socket.roomId].roomState.ready.includes(false))) {
                rooms[socket.roomId].turn = (Date.now() % 2);
                rooms[socket.roomId].start = true;
                setTimeout(() => {
                    socket.emit('giveTurn', rooms[socket.roomId].turn);
                    socket.to(socket.roomId).emit('giveTurn', rooms[socket.roomId].turn);
                }, 100);
            }
        }
    });
    
    const joinRoom = (socket, room) => {
        let position;
        if (room.roomState.connections.includes(false)) {    
            socket.join(room.id);
            socket.roomId = room.id;
            if (room.roomState.connections[0] == false) {
                room.sockets[0] = socket;
                room.roomState.connections[0] = true;
                position = 0;
            } else {
                if (room.roomState.connections[1] == false) {
                    room.sockets[1] = socket;
                    room.roomState.connections[1] = true;
                    position = 1;
                }
            }
            setTimeout(() => {
                socket.to(socket.roomId).emit('enterRoom', {
                    position: !position,
                    join: position,
                    nicknames: room.roomState.playerNickNames,
                    connections: room.roomState.connections
                });
                socket.emit('enterRoom', {
                    position: position,
                    join: position,
                    nicknames: room.roomState.playerNickNames,
                    connections: room.roomState.connections
                });
            }, 100);
        } else {
            socket.emit('roomIsFull', "방이 가득 찼습니다.");
        }
    };

    socket.on('createRoom', (account) => {
        const room = {
            id: uuidv4(), // generate a unique id for the new room, that way we don't need to deal with duplicates.
            name: account,
            sockets: [false, false],
            roomState: roomState,
            start: false,
            map:   [0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0],
            p1HP: 3,
            p2HP: 3,
        };
        //room.roomState.playerPubKey[0] = true;
        //room.roomState.playerNickNames[0] = ;
        rooms[room.id] = room;
        // have the socket join the room they've just created.
        joinRoom(socket, room);
    });
    socket.on('joinRoom', (roomId) => {
        const room = rooms[roomId];
        joinRoom(socket, room);
    });
    
    const leaveRooms = (socket) => {
        if (rooms[socket.roomId]) {
        rooms[socket.roomId].roomState.ready = [false, false];
        rooms[socket.roomId].start = false;
        rooms[socket.roomId].map = [0, 0, 0, 0, 0, 0, 0,
                                    0, 0, 0, 0, 0, 0, 0,
                                    0, 0, 0, 0, 0, 0, 0,
                                    0, 0, 0, 0, 0, 0, 0,
                                    0, 0, 0, 0, 0, 0, 0,
                                    0, 0, 0, 0, 0, 0, 0,
                                    0, 0, 0, 0, 0, 0, 0];
        rooms[socket.roomId].p1HP = 3;
        rooms[socket.roomId].p2HP = 3;
        }
        const roomsToDelete = [];
        for (const id in rooms) {
            const room = rooms[id];
            // check to see if the socket is in the current room
            for (const i in room.sockets) {
                if (room.sockets[i] == socket) {
                    room.roomState.connections[i] = false;
                    room.roomState.ready[i] = false;
                    room.sockets[i] = false;
                    socket.to(socket.roomId).emit('leaveRoom', i);
                    socket.leave(id);
                }
            }
            // Prepare to delete any rooms that are now empty
            if (!room.sockets[0] && !room.sockets[1]) {
                roomsToDelete.push(room);
            }
        }
      
        // Delete all the empty rooms that we found earlier
        for (const room of roomsToDelete) {
            delete rooms[room.id];
        }
    };

    const removeRooms = () => {
        const roomsToDelete = [];
        for (let i = 0; i < rooms.length; i++) {
            if (rooms[i].sockets.length == 0) {
                roomsToDelete.push(rooms[i]);
            }
        }
        for (const room of roomsToDelete) {
            delete rooms[room.id];
        }
    }
    setInterval(() => {
        removeRooms();
    }, 100);
    socket.on('leaveRoom', () => {
        leaveRooms(socket);
    });

    socket.on('disconnect', () => {
        leaveRooms(socket);
    });

    socket.on('reqRoomNames', () => {
        let roomNames = [];
        for (const id in rooms) {
            if (rooms[id].roomState.connections.includes(false)) {
                roomNames.push({
                    id: id,
                    name: rooms[id].name,
                    connections: "(1 / 2)",
                    //nicknames: rooms[id].roomState.playerNickNames,
                    nicknames: [0, 1]
                })
            } else {
                roomNames.push({
                    id: id,
                    name: rooms[id].name,
                    connections: "(2 / 2)",
                    nicknames: [0, 1]
                    //nicknames: rooms[id].roomState.playerNickNames,
                })
            }
            
        }
        socket.emit('resRoomNames', roomNames);
    });

    socket.on('hide', (data) => {
        if (!data.pos) {
            rooms[socket.roomId].p1X = data.x;
            rooms[socket.roomId].p1Y = data.y;
        } else {
            if (data.pos) {
                rooms[socket.roomId].p2X = data.x;
                rooms[socket.roomId].p2Y = data.y;
            }
        }
        if (rooms[socket.roomId].map[data.x + data.y * 7]) {
            socket.to(socket.roomId).emit('hide', data);
        } else {
            socket.to(socket.roomId).emit('hide');
        }
        socket.emit('hide', data);
    });

    socket.on('opening', (data) => {
        rooms[socket.roomId].map[data.x + data.y * 7] = 1;
            
            if (!data.firstTurn) {
                if (data.pos) {
                    if (data.x == rooms[socket.roomId].p1X && data.y == rooms[socket.roomId].p1Y) {
                        rooms[socket.roomId].p1HP--;
                        socket.emit('hit', {
                            shoot: data.pos,
                            pos: 0,
                            x: data.x,
                            y: data.y,
                        });
                        socket.to(socket.roomId).emit('hit', {
                            shoot: data.pos,
                            pos: 0,
                            x: data.x,
                            y: data.y,
                        });
                        if (rooms[socket.roomId].p1HP < 1) {
                            socket.emit('win', {
                                connections: rooms[socket.roomId].roomState.connections,
                                x: rooms[socket.roomId].p1X,
                                y: rooms[socket.roomId].p1Y,
                            });
                            socket.to(socket.roomId).emit('lose', rooms[socket.roomId].roomState.connections);
                            
                            rooms[socket.roomId].roomState.ready = [false, false];
                            rooms[socket.roomId].start =  false;
                            rooms[socket.roomId].map = [0, 0, 0, 0, 0, 0, 0,
                                                        0, 0, 0, 0, 0, 0, 0,
                                                        0, 0, 0, 0, 0, 0, 0,
                                                        0, 0, 0, 0, 0, 0, 0,
                                                        0, 0, 0, 0, 0, 0, 0,
                                                        0, 0, 0, 0, 0, 0, 0,
                                                        0, 0, 0, 0, 0, 0, 0];
                            rooms[socket.roomId].p1HP = 3;
                            rooms[socket.roomId].p2HP = 3;
                        }
                    } else {
                        if (rooms[socket.roomId].map[rooms[socket.roomId].p2X + rooms[socket.roomId].p2Y * 7]) {
                            socket.to(socket.roomId).emit('open', {
                                ...data, selfOpen: true
                            });
                            socket.emit('open', data);
                        } else {
                            socket.emit('open', data);
                            socket.to(socket.roomId).emit('open', data);
                        }
                    }
                } else {
                    if (!data.pos) {
                        if (data.x == rooms[socket.roomId].p2X && data.y == rooms[socket.roomId].p2Y) {
                            rooms[socket.roomId].p2HP--;
                            socket.emit('hit', {
                                shoot: data.pos,
                                pos: 1,
                                x: data.x,
                                y: data.y,
                            });
                            socket.to(socket.roomId).emit('hit', {
                                shoot: data.pos,
                                pos: 1,
                                x: data.x,
                                y: data.y,
                            });
                            if (rooms[socket.roomId].p2HP < 1) {
                                socket.emit('win', {
                                    connections: rooms[socket.roomId].roomState.connections,
                                    x: rooms[socket.roomId].p2X,
                                    y: rooms[socket.roomId].p2Y,
                                });
                                socket.to(socket.roomId).emit('lose', rooms[socket.roomId].roomState.connections);
                                rooms[socket.roomId].roomState.ready = [false, false];
                                rooms[socket.roomId].start =  false;
                                rooms[socket.roomId].map = [0, 0, 0, 0, 0, 0, 0,
                                                            0, 0, 0, 0, 0, 0, 0,
                                                            0, 0, 0, 0, 0, 0, 0,
                                                            0, 0, 0, 0, 0, 0, 0,
                                                            0, 0, 0, 0, 0, 0, 0,
                                                            0, 0, 0, 0, 0, 0, 0,
                                                            0, 0, 0, 0, 0, 0, 0];
                                rooms[socket.roomId].p1HP = 3;
                                rooms[socket.roomId].p1MP = 1;
                                rooms[socket.roomId].p2HP = 3;
                                rooms[socket.roomId].p2MP = 1;
                            }
                        } else {
                            if (rooms[socket.roomId].map[rooms[socket.roomId].p2X + rooms[socket.roomId].p2Y * 7]) {
                                socket.to(socket.roomId).emit('open', {
                                    ...data, selfOpen: true
                                });
                                socket.emit('open',data);
                            } else {
                                socket.emit('open', data);
                                socket.to(socket.roomId).emit('open', data);
                            }
                        }
                    }
                }
            }
        
        rooms[socket.roomId].turn = (!rooms[socket.roomId].turn);
        setTimeout(() => {
            socket.emit('giveTurn', rooms[socket.roomId].turn);
            socket.to(socket.roomId).emit('giveTurn', rooms[socket.roomId].turn);
        }, 100);
    })
});

server.listen(port, '0.0.0.0', function() {
  console.log(`Socket IO server listening on port ${port}`);
});

app.use(
    cors({
      origin: ['https://dik654.github.io/hiding-bros-game/'],
      credentials: true,
    }),
  );
  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));