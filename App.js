//setup project
const { time } = require("console");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var localhost = 3000;
var users = new Array;

//data base
const sqlite = require("sqlite3").verbose();
db = new sqlite.Database('./data/data.sqlite')

app.get('/', (_, res) => {
    res.sendFile(__dirname + "/public/index.html");
})

app.use(express.static('public'));

io.on('connection', socket => {
    socket.join("global");
    var person;
    console.log(socket.id + " connected")
    socket.on("addUser", (user) => {
        if(users[user.name] == undefined){
                person = user
                console.log(`the username of ${user.id} is ${user.name}`)
                users[user.name] = user;
                db.serialize(function(){
                    db.run(`INSERT INTO users (userid, username, email, password, online) VALUES ("${socket.id}", "${person.name}", "${person.email}", "${person.password}", "true");`);
                    db.run(`create table if not exists ${person.name}_messages (content char, sender char, gettingTime date)`)
                })
                socket.emit("saccufully-add_user", user)
        } else {
            socket.emit("incorrect-username")
        }
    })
    socket.on("disconnect", () => {
        console.log(person.name + " disconnected")
        delete users[person.name];
        db.run(`UPDATE users SET online='false' WHERE username = '${person.name}'`)
    })
    socket.on("send_msg", (msg) => {
        io.to(msg.receiver).emit("new_msg", msg);
        db.serialize(function(){
            db.run(`INSERT INTO ${msg.receiver}_messages (content, sender, gettingTime) VALUES ("${msg.text}", "${msg.sender}", "${Date.now()}");`);
        })
    })
    socket.on("login_request", info => {
        db.serialize(function() {
            db.get(`SELECT online, username, password, email, count(*) FROM users WHERE username = "${info.name}"`, (err, row) => {
                if(err){
                    socket.emit("login_unsaccufully", "ERROR : error isn't from you, that's from our server, please try again later")
                    console.log("cannot read, error:" + err)
                }
                if(row['count(*)'] === 0) {
                    socket.emit('login_unsaccufully', "user doesn't exist");
                } else {
                    console.log(row)
                    if (row.password === info.password) {
                        if(row.online === 'false'){
                            var person2 = {
                                name : row.username,
                                id : socket.id,
                                password : row.password
                            }
                            socket.emit("login_saccufully", person2)
                            person = person2
                            db.run(`UPDATE users SET userid = '${socket.id}', online = 'true' WHERE username = '${row.username}'`);
                        } else {
                            socket.emit("login_unsaccufully", "you can login just with one device")
                        }
                    } else {
                        socket.emit("login_unsaccufully", "check your password")
                        console.log(row.password)
                    }
                }
            })
        })
    })
    socket.on("search_contact", username => {
        db.get(`SELECT count(*), userid, username, email FROM users WHERE username = '${username}`, (err, row) => {
            if(err){
                socket.emit("cannot_search", "ERROR: error isn't fom you, it's from us, try again later")
                console.log("cannot search contact, error: " + err + " " + Date.now())
            }
            if(row['count(*)'] === 0) {
                socket.emit("cannot_search", "cannot find user check input")
            } else { 
                socket.emit("user_finded", row)
            }
        })
    })
    socket.on("search_massages", (chat) => {
        if (chat === "global") {
            db.get(`SELECT content FROM global_messages`, (err, massages) => {
                if (err) {
                    socket.emit("cannot_search", "cannot get messages, please try again later")
                    console.log("cannot search massages, error: "+ err + " " + Date.now())
                } else {
                    socket.emit("results", massages)
                }
            })
        }
    })
})
server.listen(localhost, () => {
    console.log('listening on: ' + localhost)
})

db.serialize(function() {
    console.log('creating databases if they don\'t exist');
    db.run('create table if not exists users (userid char, username text not null, email char, password char, online text)');
    db.run(`create table if not exists global_messages (content char, sender char, gettingTime date)`)
});