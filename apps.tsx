import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isBlocked } from '../features/blocking/config';
import { FocusOverlay, InstalledApp } from '../native/focusOverlay';
import { useStore } from '../state/store';
import { Button, H1, Muted } from '../ui/kit';
import { colors } from '../ui/theme';

export default function Apps() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const blocked = useStore((s) => s.blockedApps);
  const toggle = useStore((s) => s.toggleBlockedApp);

  const [apps, setApps] = useState<InstalledApp[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    FocusOverlay.getInstalledApps()
      .then((list) => alive && setApps(list))
      .catch(() => alive && setApps([]));
    return () => {
      alive = false;
    };
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = apps ?? [];
    return q ? base.filter((a) => a.label.toLowerCase().includes(q)) : base;
  }, [apps, query]);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 8 }]}>
      <H1>Distracting apps</H1>
      <Muted>{blocked.length} selected. These are blocked while a session is running.</Muted>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search apps"
        placeholderTextColor={colors.muted}
        style={styles.search}
        autoCapitalize="none"
      />
      {apps === null ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(a) => a.packageName}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Muted>No apps found.</Muted>}
          renderItem={({ item }) => {
            const on = isBlocked(blocked, item.packageName);
            return (
              <Pressable onPress={() => toggle(item)} style={styles.row}>
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.mark, on && { color: colors.accent }]}>{on ? '● Blocked' : '○'}</Text>
              </Pressable>
            );
          }}
        />
      )}
      <Button title="Done" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, gap: 12 },
  search: {
    backgroundColor: colors.cardAlt,
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { color: colors.text, fontSize: 16, flex: 1, paddingRight: 12 },
  mark: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});
