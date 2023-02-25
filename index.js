#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');

const connections = []

const base = {
    op: "set",
    data: {
        artists: [{ id: "uuid1", name: 'Nick Cave' }, { id: "uuid2", name: 'Johnny Cash' }, { id: "uuid3", name: 'Willie Nelson' }],
        tours: [{ id: 'uuid4', name: 'A tour' }],
        gigs: [{ id: 'uuid5', name: 'A gig', date: '2023-05-24', artists: ["uuid1", "uuid2"], venue: "uuid6", tour: "uuid4" }],
        venues: [{ id: 'uuid6', name: 'A venue', address: 'street 1', city: 'In city' }]
    }
}

var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, function () {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

wsServer.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }


    var connection = request.accept('rootsy-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connections.push(connection)
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connections.forEach(c => {
                c.sendUTF(message.utf8Data)
            });
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function (reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        const index = connections.findIndex(val => val === connection)

        connections.splice(index, 1)
    });

    connection.sendUTF(JSON.stringify(base))
});