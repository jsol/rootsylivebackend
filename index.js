#!/usr/bin/env node
var WebSocketServer = require('websocket').server;
var http = require('http');
var cors = require('cors');
var fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const fileUpload = require('express-fileupload');
const mysql = require('mysql');
const { OAuth2Client } = require('google-auth-library');
const util = require('util')

const clientid = '1039428997368-jvk0rvjghohhu5i83buhaf2g46nac9v8.apps.googleusercontent.com'
const client = new OAuth2Client(clientid);
const app = express();

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'rootsylive',
    password: process.env.MYSQL_PASS || 'rootsylive',
    database: process.env.MYSQL_DB || 'rootsylive'
});

function query(sql) {
    return new Promise((resolve, reject) => {
        pool.query(sql, function (error, results, fields) {
            if (error) {
                return reject(error);
            }
            return resolve(results)
        });
    })
}

function getDataFromDb() {
    const promises = []
    const msg = {
        op: "set",
        data: {
            artists: [],
            gigs: [],
            venues: [],
            promoters: [],
            contracts: []
        },
        settings: {}
    }

    for (const [key, value] of Object.entries(msg.data)) {
        console.log("select * from rootsylive." + key)
        promises.push(query("select * from rootsylive." + key).then(res => res.map(r => JSON.parse(r.jsondata))).then(d => {
            msg.data[key] = d
        }))
    }

    promises.push(query("select * from rootsylive.options").then(res => {
        const options = {}
        for (const row of res) {
            if (!options[row.category]) {
                options[row.category] = [row.name]
            } else {
                options[row.category].push(row.name)
            }
        }
        return options
    }).then(r => {
        msg.settings.options = r
    }))

    promises.push(query("select * from rootsylive.templates").then(res => {
        const templates = {}
        for (const row of res) {
            if (!templates[row.category]) {
                templates[row.category] = [JSON.parse(row.template)]
            } else {
                templates[row.category].push(JSON.parse(row.template))
            }
        }

        return templates
    }).then(t => {
        msg.settings.templates = t
    }))

    return Promise.all(promises).then(() => {
        return msg
    })
}

getDataFromDb().then(d => {

    console.log(util.inspect(d, { showHidden: false, depth: null, colors: true }))

})

app.use(fileUpload({
    createParentPath: true
}));
app.use(cors());

app.post('/upload-file', (req, res) => {
    console.log("Uploading")
    try {
        if (!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let avatar = req.files.file;
            console.log(avatar)
            //Use the mv() method to place the file in upload directory (i.e. "uploads")

            const newName = Date.now() + '-' + avatar.name
            avatar.mv('./uploads/' + newName);
            console.log(newName)
            fs.writeFile('./mime/' + newName, avatar.mimetype, () => { })
            //send response
            res.send({
                status: true,
                message: 'File is uploaded',
                data: {
                    name: avatar.name,
                    newName: newName,
                    mimetype: avatar.mimetype,
                    size: avatar.size
                }
            });
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err);
    }
});


app.get('/download-file/:filename', (req, res) => {
    const mime = fs.readFileSync('./mime/' + req.params.filename, 'utf8').trim()
    console.log(mime)
    console.log('FILE', req.params.filename)
    res.setHeader("content-type", mime);
    fs.createReadStream(`./uploads/${req.params.filename}`).pipe(res);
})


function applyId(obj) {
    if (typeof obj != 'object') {
        return
    }
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object') {
            applyId(value)
        } else if (typeof value === 'array') {
            value.forEach(v => applyId(v))
        } else if (typeof value === 'string') {
            if (key == 'id' && value == '') {
                obj.id = uuidv4()
            }
        }
    }
}

const connections = []

const base = {
    op: "set",
    data: {
        artists: [{ id: "uuid1", name: 'Nick Cave' }, { id: "uuid2", name: 'Johnny Cash' }, { id: "uuid3", name: 'Willie Nelson' }],
        tours: [{ id: 'uuid4', name: 'A tour' }],
        gigs: [{ id: 'uuid5', name: 'A gig', date: '2023-05-24', artists: ["uuid1", "uuid2"], venue: "uuid6", tour: "uuid4" }],
        venues: [{ id: 'uuid6', name: 'A venue', address: 'street 1', city: 'In city' }],
        promoters: [{ id: 'uuid7', name: 'A promoter' }]
    },
    settings: {
        options: {
            hospitality: ["Band rider", "Inhouse", "Rootsy Rider", "No hospitality"],
            state: ["WIP", "Signed", "Ready", "Billed", "Archived"],
            bandFormat: ["Solo", "Duo", "Band"],
            templates: ['gig.guarantee']
        },
        templates: {
            "gig.guarantee": [
                {
                    id: 'uuid-template-1',
                    name: 'Standard',
                    text: 'Yadayada: 10'
                }
            ]
        }
    }
}

var server = http.createServer(app);

server.listen(process.env.PORT || 20080, function () {
    console.log((new Date()) + ' Server is listening on port ', process.env.PORT || 20080);
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
const users = ['jens@rootsy.nu']

function userOk(user) {
    return new Promise((resolve, reject) => {
        pool.query("SELECT valid from users WHERE id = ?", [user.sub], (error, results, fields) => {
            if (error) {
                return reject(error);
            }
            if (results.length == 0) {
                pool.query("INSERT INTO users (id, email) VALUES (?, ?)", [user.sub, user.email], (err) => { if (err) console.log(err)})
                return resolve(false)
            }
            return resolve(results[0].valid == 1)
        })
    })

}

async function verifyAuth(conn, token) {
    console.log("Got auth request with token", token)

    if (process.env.LOCAL_DEV) {
        conn.authToken = "wooop"
        const data = await getDataFromDb()
        conn.sendUTF(JSON.stringify(data))
        return
    }

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: clientid,
    });

    const payload = ticket.getPayload();
    const userid = payload['sub'];
    console.log(payload, userid)

    if (await userOk(payload)) {
        const data = await getDataFromDb()
        conn.authToken = token
        conn.sendUTF(JSON.stringify(data))
    }
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

            const obj = JSON.parse(message.utf8Data)

            if (obj.op == 'auth') {
                verifyAuth(connection, obj.auth)
            }

            if (!connection.authToken) {
                return
            }

            if (obj.op == 'del') {
                connections.forEach(c => {
                    if (c.authToken) {
                        c.sendUTF(message.utf8Data)
                    }
                });

                pool.query(`DELETE FROM ${obj.delete.type} WHERE id = ?`, [ obj.delete.id], (err) => {if (err) console.log(err)})
            }

            if (obj.op == 'set') {
                applyId(obj.data)
                applyId(obj.settings)

                for (const [key, value] of Object.entries(obj.data)) {

                    obj.data[key].forEach(e => {
                        const ins = JSON.stringify(e)
                        pool.query(`INSERT INTO rootsylive.${key} (id, jsondata) VALUES (?, ?) ON DUPLICATE KEY UPDATE jsondata =  ?`, [e.id, ins, ins], () => {
                            console.log(`Added ${key} with id ${e.id}`)
                        });
                    })

                    /** Implement rm, update settings */
                }
                const out = JSON.stringify(obj)
                connections.forEach(c => {
                    if (c.authToken) {
                        c.sendUTF(out)
                    }
                });
            }
        }

    });
    connection.on('close', function (reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        const index = connections.findIndex(val => val === connection)

        connections.splice(index, 1)
    });

    connection.sendUTF(JSON.stringify({
        op: 'auth',
        data: {
            artists: [],
            tours: [],
            gigs: [],
            venues: [],
            promoters: []
        }
    }))

});