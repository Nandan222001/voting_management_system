import { navigationService } from '../utils/navigationService';
import { showToast } from '../utils/toast';

/**
 * Push Notification Service
 * This service handles incoming push notifications and routes them correctly.
 * It can be integrated with Firebase (FCM) or Expo Notifications.
 */
export const pushNotificationService = {
  /**
   * Handle the notification payload and navigate to the correct screen.
   */
  handleNotificationTap: (payload: any) => {
    console.log('--- [PushNotificationService] Notification Tapped ---');
    console.log('Notification Payload:', JSON.stringify(payload, null, 2));

    const { screen, route, params, election_id, target_id, notification_type } = payload;
    
    // Resolve the target screen
    const targetScreen = screen || route || notification_type;
    const resolvedParams = params || { id: election_id || target_id };

    console.log('Navigating To:', targetScreen);
    console.log('Navigation Params:', JSON.stringify(resolvedParams, null, 2));

    if (!targetScreen) {
      console.warn('[PushNotificationService] No target screen specified in payload. Defaulting to Dashboard.');
      navigationService.navigate('Dashboard');
      return;
    }

    // Task 6: Handle nested navigators correctly
    switch (targetScreen) {
      case 'Voting':
      case 'election':
        navigationService.navigate('Voting', { election: resolvedParams }, 'Elections');
        break;
      
      case 'EventDetail':
      case 'event':
        navigationService.navigate('EventDetail', { event: resolvedParams }, 'Profile');
        break;
      
      case 'AnnouncementDetail':
      case 'announcement':
        navigationService.navigate('AnnouncementDetail', resolvedParams);
        break;
      
      case 'Nomination':
        navigationService.navigate('Nomination', resolvedParams, 'Elections');
        break;
      
      default:
        console.warn(`[PushNotificationService] Unrecognized screen: ${targetScreen}. Navigating to Notifications.`);
        navigationService.navigate('Notifications');
        break;
    }
  },

  /**
   * Setup listeners for foreground and background notifications.
   * This is a template. Integration with a library like @react-native-firebase/messaging is required.
   */
  init: () => {
    console.log('[PushNotificationService] Initializing notification listeners...');

    // 1. Foreground Notification
    // messaging().onMessage(async remoteMessage => {
    //   console.log('[PushNotificationService] Foreground Message Received:', remoteMessage);
    //   showToast.info(remoteMessage.notification?.title || 'New Notification', remoteMessage.notification?.body);
    // });

    // 2. Background/Quit state notification tap
    // messaging().onNotificationOpenedApp(remoteMessage => {
    //   pushNotificationService.handleNotificationTap(remoteMessage.data);
    // });

    // 3. Cold Start (App closed)
    // messaging().getInitialNotification().then(remoteMessage => {
    //   if (remoteMessage) {
    //     pushNotificationService.handleNotificationTap(remoteMessage.data);
    //   }
    // });
  }
};
