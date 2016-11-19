// export function for listening to the socket
module.exports = function (socket) {

  // broadcast state changes
  socket.on('update:state', function (data) {
    socket.broadcast.emit('update:state', data);
  });

};
