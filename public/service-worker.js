// // public/service-worker.js
// self.addEventListener('push', function(event) {
//     const data = event.data.json();
//     const title = data.title || 'New Notification';
//     const options = {
//       body: data.body || 'You have a new message.',
//       icon: data.icon || '/fire.png',
//       data: {
//         url: data.url || '/' // URL to open on click
//       }
//     };
  
//     event.waitUntil(
//       self.registration.showNotification(title, options)
//     );
//   });
  
//   self.addEventListener('notificationclick', function(event) {
//     event.notification.close();
//     event.waitUntil(
//       clients.openWindow(event.notification.data.url)
//     );
//   });  