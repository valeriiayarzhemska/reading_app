import { requireOptionalNativeModule } from 'expo';

interface HomeWidgetModule {
  update(json: string): void;
}

// "Optional": null on iOS, which has its own widget (expo-widgets)
const native = requireOptionalNativeModule<HomeWidgetModule>('HomeWidget');

// Saves the props for the Android "Continue reading" widget and redraws it.
// Same shape as the iOS widget's props, sent as JSON.
export function updateAndroidHomeWidget(props: object) {
  native?.update(JSON.stringify(props));
}
