const socket = io()

// socket.on("countUpdated", (count) => {
//   console.log("count Updated!" ,count)
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log("clicked")
//     socket.emit("increment")
// })
const messageFormButton = document.querySelector('#sendMessage')
const messageFormInput = document.querySelector('#text')
const sendLocationButton = document.querySelector('#send-location')
const messagesDiv = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

//Options
const {username,room} = Qs.parse(location.search, {ignoreQueryPrefix : true} )

const autoScroll = () => {
    //new message element
    const messagesDiv = document.querySelector('#messages')
    const newMessage = messagesDiv.lastElementChild

    //height of the new message

    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = messagesDiv.offsetHeight

    //Height of the message container
    const containerHeight = messagesDiv.scrollHeight

    //How far have i scrolled
    const scrollOffset = messagesDiv.scrollTop + visibleHeight
//console.log(newMessageHeight,visibleHeight,containerHeight,scrollOffset)
    if(containerHeight - newMessageHeight <= scrollOffset){
        messagesDiv.scrollTop = messagesDiv.scrollHeight
        //console.log(messagesDiv.scrollTop,messagesDiv.scrollHeight)
    }



}
socket.on("message",(message) =>  {
 console.log(message)
   const html = Mustache.render(messageTemplate,{
       username : message.username,
       message : message.text,
       createdAt : moment(message.createdAt).format("h:mm a")
   }) 
   messagesDiv.insertAdjacentHTML('beforeend',html)
   autoScroll()
})

socket.on("locationMessage", (location) => {
    console.log(location)
    const html = Mustache.render(locationTemplate,{
        username : location.username,
        location : location.url,
        createdAt : moment(location.createdAt).format("h:mm a")
    }) 
    messagesDiv.insertAdjacentHTML('beforeend',html)
    autoScroll()
})

socket.on("roomData",({room,users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})
messageFormButton.addEventListener('click', (e) => {
    e.preventDefault()
    messageFormButton.setAttribute("disabled","disabled")
    const msg = messageFormInput.value
    socket.emit('sendMessage',msg,(error) => {
        messageFormButton.removeAttribute("disabled")
        messageFormInput.value = ''
        messageFormInput.focus()
        if(error){
           return console.log("Error : ",error)
        }

        console.log("Delivered!")
       
    })
})
sendLocationButton.addEventListener("click", () =>{
    if(!navigator.geolocation){
        return alert("Geo location is not supported by your browser")
    }
    sendLocationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        
       socket.emit("sendLocation",{
           latitude : position.coords.latitude,
           longitude : position.coords.longitude
       },(msg) => {
           sendLocationButton.removeAttribute('disabled')
           console.log(msg)
       })
    })
})

socket.emit("join", {
    username,
    room
},(error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})