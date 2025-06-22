import { useUserStore } from '@/store/userStore';

export async function restoreSession() {
  const userStore = useUserStore.getState();
  await userStore.restoreSession();
}