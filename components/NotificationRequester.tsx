// // components/NotificationRequester.tsx
// 'use client';
// import { useEffect } from 'react';

// const requestNotificationPermission = async () => {
//   if (!('Notification' in window)) {
//     console.log('This browser does not support desktop notification');
//     return;
//   }

//   const permission = await Notification.requestPermission();
//   if (permission === 'granted') {
//     console.log('Notification permission granted.');
//     // You'd also subscribe the user here and send the subscription to your server
//   } else {
//     console.log('Notification permission denied.');
//   }
// };

// const NotificationRequester = () => {
//   useEffect(() => {
//     // You might want to ask for permission based on user action, not on mount
//   }, []);

//   return (
//     <button onClick={requestNotificationPermission}>
//       Enable Notifications
//     </button>
//   );
// };

// export default NotificationRequester;