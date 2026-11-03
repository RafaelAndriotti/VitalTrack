import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { X } from 'lucide-react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';

interface ModalSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** `sheet` = painel inferior; `center` = caixa centralizada. */
  variant?: 'sheet' | 'center';
  children: ReactNode;
}

export function ModalSheet({ visible, title, onClose, variant = 'sheet', children }: ModalSheetProps) {
  const centered = variant === 'center';
  return (
    <Modal
      visible={visible}
      transparent
      animationType={centered ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={centered ? s.overlayCenter : s.overlay}>
        <View style={[s.container, centered && s.centered]}>
          <View style={s.header}>
            <Text style={s.title}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} hitSlop={8}>
              <X size={Icon.lg} color={Colors.textSecondary} strokeWidth={Icon.stroke} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '90%',
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  centered: { width: '100%', maxWidth: 400, borderRadius: BorderRadius.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text, flex: 1 },
});
