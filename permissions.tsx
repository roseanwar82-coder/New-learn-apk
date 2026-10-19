import { useRouter } from 'expo-router';
import React from 'react';

import { requestNotifications, usePermissions } from '../features/permissions/usePermissions';
import { FocusOverlay } from '../native/focusOverlay';
import { Body, Button, Card, H1, H2, Muted, Row, Screen } from '../ui/kit';
import { colors } from '../ui/theme';

function Status({ ok }: { ok: boolean }) {
  return <Muted style={{ color: ok ? colors.good : colors.warn }}>{ok ? 'Allowed' : 'Not allowed'}</Muted>;
}

export default function Permissions() {
  const router = useRouter();
  const [p, refresh] = usePermissions();

  const run = (fn: () => void) => {
    try {
      fn();
    } catch {
      // settings screen unavailable on this device
    }
  };

  return (
    <Screen>
      <H1>Permissions</H1>
      <Muted>
        StudyStreak asks only for what each feature needs. Everything stays on your phone, except a question you circle,
        which is sent to the AI service you configure.
      </Muted>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>Display over other apps</H2>
          <Status ok={p.overlay} />
        </Row>
        <Body>Required. Shows the floating timer on top of your study apps.</Body>
        {!p.overlay && <Button title="Allow" onPress={() => run(() => FocusOverlay.requestOverlayPermission())} />}
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>Usage access</H2>
          <Status ok={p.usage} />
        </Row>
        <Body>Needed for app blocking, so the app can tell which app is open. It is never uploaded.</Body>
        {!p.usage && <Button title="Allow" variant="ghost" onPress={() => run(() => FocusOverlay.requestUsageAccess())} />}
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>Notifications</H2>
          <Status ok={p.notifications} />
        </Row>
        <Body>Android shows a small ongoing notification while a session runs. Without this permission it is hidden.</Body>
        {!p.notifications && (
          <Button title="Allow" variant="ghost" onPress={() => requestNotifications().then(refresh)} />
        )}
      </Card>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>Battery</H2>
          <Status ok={p.battery} />
        </Row>
        <Body>
          Recommended on Xiaomi, Oppo, Vivo and Samsung phones. Without it the system may stop the timer when your screen is off.
        </Body>
        {!p.battery && (
          <Button title="Open battery settings" variant="ghost" onPress={() => run(() => FocusOverlay.openBatterySettings())} />
        )}
      </Card>

      <Card>
        <H2>Screen capture</H2>
        <Body>
          Circle to solve asks Android for permission the first time you use it in a session. Choose "Entire screen" so the
          question can be captured from whichever app you're in. Some apps block screen capture, and those will appear blank.
        </Body>
      </Card>

      <Button title="Done" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}
