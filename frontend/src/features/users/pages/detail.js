import { signal } from '@kupola/core';
import { useRoute, useRouter } from '@kupola/router';
import { getUser as getUserRequest } from '../../../api/users.js';
import { detailPageView } from '../view.js';

export default function DetailPage() {
  const router = useRouter();
  const route = useRoute();
  const userId = route?.params?.id;

  const user = signal(null);

  void getUserRequest(userId)
    .then(record => {
      user.value = record;
    })
    .catch(() => {
      user.value = null;
    });

  function handleBack() {
    router.push('/users');
  }

  return detailPageView({ user, onBack: handleBack });
}
