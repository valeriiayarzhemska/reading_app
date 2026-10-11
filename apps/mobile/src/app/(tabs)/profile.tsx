import { router } from 'expo-router';
import { Button } from '@/components/ui/button';
import { ComingSoon } from '@/components/coming-soon';

export default function ProfileScreen() {
  return (
    <ComingSoon
      title="Profile"
      description="Your stats, calendar, goals and settings."
    >
      {__DEV__ ? (
        <Button
          title="Design system"
          variant="secondary"
          onPress={() => router.push('/design')}
          className="mt-6 self-stretch"
        />
      ) : null}
    </ComingSoon>
  );
}
