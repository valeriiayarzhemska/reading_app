import { createMMKV } from 'react-native-mmkv';

// Everything the timer keeps on the phone: the running session and the
// queue of finished sessions waiting to be sent. Synchronous, unlike
// SecureStore/AsyncStorage, so it's available on the very first render.
export const timerStorage = createMMKV({ id: 'timer' });
