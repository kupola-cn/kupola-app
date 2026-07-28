import { useRouter } from '@kupola/router';
import { statusPageView } from '../views/StatusPageView.js';

export function ForbiddenPage() {
  const router = useRouter();

  return statusPageView({
    containerClass: 'forbidden-container',
    cardClass: 'forbidden-card',
    iconClass: 'forbidden-icon',
    icon: '403',
    title: '无权访问',
    message: '抱歉，您没有权限访问此页面',
    onHome: () => router.push('/'),
  });
}
