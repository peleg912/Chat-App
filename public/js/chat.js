const socket = io();

const $messageForm = document.getElementById('mForm');
const $messageFormInput = document.getElementById('msgInput');
const $messageFormBtn = document.getElementById('msgBtn');
const $locationBtn = document.getElementById('send-loc');
const $messages = document.getElementById('messages');

//Templates
const msgTemplate = document.getElementById('msg-template').innerHTML;
const locationTemplate= document.getElementById('location-template').innerHTML;
const sideBarTemplate = document.getElementById('sidebar-template').innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = ()=> {
 //New message elements   
 const $newMessage = $messages.lastElementChild;

 //Height of new messages
 const newMessageStyles = getComputedStyle($newMessage);
 const newMessageMargin = parseInt(newMessageStyles.marginBottom);
 const newMessageHeight = $newMessage.offsetheight + newMessageMargin;

 //Visible height
 const visibleHeight = $messages.offsetHeight;

//Height of message container
 const containerHeight = $messages.scrollHeight;

//How far have I scrolled?
 const scrollOffSet = $messages.scrollTop + visibleHeight;

if(containerHeight - newMessageHeight <= scrollOffSet){
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message', (obj)=> {
    const html = Mustache.render(msgTemplate, {
        username: obj.username,
        msg: obj.text,
        createdAt: moment(obj.createdAt).format('HH:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', (obj)=> {
    const html = Mustache.render(locationTemplate, {
        username: obj.username,
        url: obj.url,
        createdAt: moment(obj.createdAt).format('HH:mm')
    });

    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});


socket.on('roomData', (obj)=> {
    console.log(obj.users);
  const html = Mustache.render(sideBarTemplate, {
      room: obj.room,
      users: obj.users
  } );

  document.getElementById('sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e)=> {
    e.preventDefault();
    $messageFormBtn.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage', document.getElementById('msgInput').value, (error)=>{
        $messageFormBtn.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if(error){
           return console.log(error);
        }
        console.log('msg delivered!');
    });
  
});




document.querySelector('#send-loc').addEventListener('click', ()=> {
    if(! navigator.geolocation){
        return alert('Geolocation is not supported on your browser');
    }

    $locationBtn.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position)=> {
        socket.emit('sendLocation', {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, ()=> {
            console.log('Location shared!');
            $locationBtn.removeAttribute('disabled');
        });
    });
});

socket.emit('join', ({username, room}), (error)=> {
    if (error){
        alert(error);
        location.href = '/';
    }
});