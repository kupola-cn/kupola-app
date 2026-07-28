import { useRouter } from '@kupola/router';
import { statusPageView } from '../views/StatusPageView.js';

export function NotFoundPage() {
  const router = useRouter();

  return statusPageView({
    containerClass: 'not-found-container',
    cardClass: 'not-found-card',
    iconClass: 'not-found-icon',
    icon: '404',
    title: '页面未找到',
    message: '抱歉，您访问的页面不存在或已被删除',
    onHome: () => router.push('/'),
  });
}
