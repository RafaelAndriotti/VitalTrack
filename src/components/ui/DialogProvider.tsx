import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Colors, Spacing, FontSize, BorderRadius, Font, Elevation } from '@/constants/theme';

/* Diálogos próprios baseados em Modal: funcionam em nativo E web.
   (Alert.alert com botões é ignorado no react-native-web.)

   RESTRIÇÃO (iOS): não abra um diálogo enquanto um ModalSheet estiver aberto.
   O iOS não apresenta um segundo <Modal> sobre outro já visível e o diálogo
   some (a Promise nunca resolve). Feche o sheet antes de chamar confirm/alert. */

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** Estiliza o botão de confirmação como ação destrutiva. */
  destructive?: boolean;
}

export interface AlertOptions {
  title: string;
  message?: string;
  okText?: string;
}

interface DialogApi {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

interface DialogRequest {
  kind: 'confirm' | 'alert';
  title: string;
  message?: string;
  confirmText: string;
  cancelText: string;
  destructive: boolean;
  resolve: (value: boolean) => void;
}

const DialogContext = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<DialogRequest | null>(null);
  const queue = useRef<DialogRequest[]>([]);
  const currentRef = useRef<DialogRequest | null>(null);

  const show = useCallback((req: DialogRequest) => {
    if (currentRef.current) {
      queue.current.push(req);
    } else {
      currentRef.current = req;
      setCurrent(req);
    }
  }, []);

  // `target` identifica o request do botão: toque duplo ou atrasado em um
  // diálogo já fechado não pode resolver o próximo da fila.
  const close = useCallback((target: DialogRequest, result: boolean) => {
    const req = currentRef.current;
    if (!req || req !== target) return;
    const next = queue.current.shift() ?? null;
    currentRef.current = next;
    setCurrent(next);
    req.resolve(result);
  }, []);

  const api = useMemo<DialogApi>(
    () => ({
      confirm: (o) =>
        new Promise<boolean>((resolve) =>
          show({
            kind: 'confirm',
            title: o.title,
            message: o.message,
            confirmText: o.confirmText ?? 'Confirmar',
            cancelText: o.cancelText ?? 'Cancelar',
            destructive: o.destructive ?? false,
            resolve,
          })
        ),
      alert: (o) =>
        new Promise<void>((resolve) =>
          show({
            kind: 'alert',
            title: o.title,
            message: o.message,
            confirmText: o.okText ?? 'OK',
            cancelText: '',
            destructive: false,
            resolve: () => resolve(),
          })
        ),
    }),
    [show]
  );

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={current !== null}
        transparent
        animationType="fade"
        onRequestClose={() => current && close(current, false)}
      >
        <View style={s.overlay}>
          {current ? (
            <View style={s.box} accessibilityRole="alert">
              <Text style={s.title}>{current.title}</Text>
              {current.message ? <Text style={s.message}>{current.message}</Text> : null}
              <View style={s.actions}>
                {current.kind === 'confirm' ? (
                  <Button
                    label={current.cancelText}
                    variant="secondary"
                    size="sm"
                    style={s.action}
                    onPress={() => close(current, false)}
                  />
                ) : null}
                <Button
                  label={current.confirmText}
                  variant={current.destructive ? 'danger' : 'primary'}
                  size="sm"
                  style={s.action}
                  onPress={() => close(current, true)}
                />
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog deve ser usado dentro de um DialogProvider');
  return ctx;
}

/** Atalho: `const confirm = useConfirm(); if (await confirm({...})) ...` */
export function useConfirm() {
  return useDialog().confirm;
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  box: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Elevation.raised,
  },
  title: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text },
  message: { fontSize: FontSize.sm, fontFamily: Font.regular, color: Colors.textSecondary, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.md },
  action: { minWidth: 96 },
});
