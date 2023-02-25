#!/usr/bin/env node
var WebSocketClient = require('websocket').client;

var client = new WebSocketClient();

const artists = [{
    "id": "uuid",
    "name": "Nick Cave"
},
{
    "id": "uuid-2",
    "name": "Johnny Cash"
},
]

client.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function (connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function () {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
        connection.close()
    });

    function sendArtists() {
        connection.sendUTF(JSON.stringify({artists}));
    }

    sendArtists();
});

client.connect('ws://localhost:8080/', 'rootsy-protocol');