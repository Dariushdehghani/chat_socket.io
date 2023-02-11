var socket = io()
var submit_btn = document.getElementById("sub_btn");
var name_inp = document.getElementById("name_inp");
var email_inp = document.getElementById("email");
var pass_inp = document.getElementById("pass_inp");
var person;
var my_contacts = new Array
var position;

window.onload = () => {
    person = localStorage.getItem("person");
    my_contacts = localStorage.getItem("contacts");
}

function add_user() {
    var password = pass_inp.value
    if(!(password.toString().length <= 7)){
            var user = {
                id:socket.id,
                name:name_inp.value,
                password:pass_inp.value,
                email:email_inp.value
            };
            socket.emit("addUser", user);
            console.log(user.name)
    } else {
        alert("incorrect password")
    }
}

submit_btn.addEventListener("click", () => {
    add_user()
})

socket.on("incorrect-username" , () => {
    alert("username is taken")
})

socket.on("saccufully-add_user", (user) => {
    go_to_contacts(user)
})

function go_to_contacts(user) {
    document.getElementById("first_screen").style.display = "none";
    document.getElementById("contacts").style.display = "block";
    document.getElementById("chat").style.display = 'none';
    var title = document.getElementById("title");
    title.innerHTML = `${user.name}'s id is ${user.id}`;
    var name_context = document.getElementById("name_context");
    name_context.innerHTML = "Login By " + user.name;
    var id_context = document.getElementById("id_context");
    id_context.innerHTML = "@" + user.id;
    socket.in_chat = false;
    if (!person) {
        person = user;
        localStorage.setItem("person", user)
    }
}

function create_contacts() {
    my_contacts = localStorage.getItem("contacts");
    if (!(my_contacts.length() === 0)) {
        for (var contact in my_contacts) {
            document.getElementById("show_contacts").innerHTML += `<div id="contact" onclick="go_to_chat('${contact.username}')">
            <h3>${contact.username}</h3>
            <h6>${contact.email}</h6>
        </div>`
        }
    }
}

var send_btn = document.getElementById("send_btn");
send_btn.addEventListener("click", () => {
    msg_text = document.getElementById("massage_text");
    if(msg_text !== ''){
        date = new Date();
        var msg = {
            text : msg_text.value,
            sender : person.name,
            receiver : position,
            date : date
        }
        socket.emit("send_msg", msg)
        msg_text.value = "";
    }
})
socket.on("new_msg", msg => {
    if (msg.sender === position) {
        socket.emit("search_massages", msg.sender)
    }
})
function go_to_chat(chat) {
    document.getElementById("contacts").style.display = "none";
    document.getElementById("chat").style.display = "block";
    document.getElementById("contact_name").innerHTML = chat;
    socket.in_chat = true;
    position = chat;
    socket.emit("search_massages", chat)
}

socket.on("results", massages => {
    var massages_ctx = document.getElementById("massages");
    massages_ctx = ""
    for(var massage in massages) {
        var massage = document.createElement("p")
        massage.innerHTML = msg.sender + " : " + msg.text;
        massage.id = msg.sender === person.name ? "my_massage" : "their_massage"
        massages_ctx.appendChild(massage);
    }
})

document.getElementById("back_from_contacts_btn").addEventListener("click", () => {
    go_to_contacts(person)
})

document.getElementById("go_to_login").addEventListener("click", () => {
    var signup_scr = document.getElementById("signup_scr");
    var login_scr = document.getElementById("login_scr");
    signup_scr.style.display = "none"
    login_scr.style.display = "block"
})
document.getElementById("go_to_signup").addEventListener("click", () => {
    var signup_scr = document.getElementById("signup_scr");
    var login_scr = document.getElementById("login_scr");
    signup_scr.style.display = "block"
    login_scr.style.display = "none"
})

document.getElementById("sub_log_btn").addEventListener("click", () => {
    var uname = document.getElementById("name_inp_log").value
    var pass = document.getElementById("pass_inp_log").value
    var info = {
        name : uname,
        password : pass
    }
    socket.emit("login_request", info)
})

socket.on("login_unsaccufully", (err) => {
    alert(err)
})

socket.on("login_saccufully", (user) => {
    go_to_contacts(user)
})

function go_add_a_contact() {
    document.getElementById("first_screen").style.display = "none";
    document.getElementById("contacts").style.display = "none";
    document.getElementById("chat").style.display = 'none';
    document.getElementById("add_a_contact_scr").style.display = 'block';
}

document.getElementById("search_contact_btn").addEventListener("click", () => {
    var contact = document.getElementById("name_of_contact_inp");
    socket.emit("search_contact", contact);
})

socket.on("cannot_search", err => {
    alert(err)
})

socket.on("user_finded", user => {
    add_a_contact(user)
})

function add_a_contact(user) {
    my_contacts.push(user);
    localStorage.setItem("contacts", my_contacts);
    create_contacts()
}
