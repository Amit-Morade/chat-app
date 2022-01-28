const socket = io()

//elements
const $form = document.querySelector('form');
const $formInput = document.querySelector('input')
const $formButton = document.querySelector('button')
const $sendLocation = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () => {
    //New Message element
    // const $newMessage = $messages.lastElementChild

    // //height of new message
    // const newMessageStyles = getComputedStyle($newMessage)
    // const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    // const newMessageHeight = $newMessage.offsetHeight + newMessageMargin 

    // //visible height
    // const visibleHeight = $messages.offsetHeight

    // //height of message container
    // const containerHeight = $messages.scrollHeight

    // //how far have I scrolled?
    // const scrollOffset = $messages.scrollTop + visibleHeight

    // if(containerHeight - newMessageHeight <= scrollOffset){
    //     $messages.scrollTop = $messages.scrollHeight
    // }

    $messages.scrollTop = $messages.scrollHeight
}

socket.on('message', (msg) => {
    const html = Mustache.render(messageTemplate, {
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a'),
        username: msg.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (url) => {
    console.log(url)
    const html = Mustache.render(locationTemplate, {
        location: url
    })
    $messages.insertAdjacentHTML('beforeend', html)
    //autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$form.addEventListener('submit', (e) => {
    e.preventDefault();

    $formButton.setAttribute('disabled', 'disabled')
    const msg = e.target.elements.message
   

    socket.emit("sendMessage", msg.value, () => {
        $formButton.removeAttribute('disabled')
        console.log("message delivered")
    })

    $formInput.value = ""
    $formInput.focus()
  
})

$sendLocation.addEventListener('click', () => {
    
    if(!navigator.geolocation){
        return alert('geolocation is not supported by your browser')
    }

    $sendLocation.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log("location shared successfully")
            $sendLocation.removeAttribute('disabled')
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})

