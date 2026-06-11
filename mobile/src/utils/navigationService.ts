import { createNavigationContainerRef, StackActions, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

/**
 * Robust Navigation Service to handle complex notification flows.
 * Supports cross-stack navigation and deep nesting.
 */
export const navigationService = {
  /**
   * Navigate to a screen with optional params and parent navigator.
   */
  navigate: (name: string, params?: any, parentName?: string) => {
    if (navigationRef.isReady()) {
      console.log(`[NavigationService] Navigating to: ${name}`, { params, parentName });
      
      try {
        if (parentName) {
          // Handle nested navigation
          navigationRef.dispatch(
            CommonActions.navigate({
              name: parentName,
              params: {
                screen: name,
                params: params,
              },
            })
          );
        } else {
          // Handle flat navigation
          navigationRef.navigate(name, params);
        }
      } catch (error) {
        console.error(`[NavigationService] Failed to navigate to ${name}:`, error);
        // Fallback to Dashboard if navigation fails
        navigationRef.navigate('Dashboard');
      }
    } else {
      console.warn('[NavigationService] Navigator not ready yet. Retrying in 100ms...');
      setTimeout(() => navigationService.navigate(name, params, parentName), 100);
    }
  },

  /**
   * Replace current screen (useful for deep links)
   */
  replace: (name: string, params?: any) => {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.replace(name, params));
    }
  },

  /**
   * Go back to previous screen
   */
  goBack: () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  },

  /**
   * Reset navigation state to a specific route
   */
  reset: (name: string, params?: any) => {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name, params }],
        })
      );
    }
  }
};
