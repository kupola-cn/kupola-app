import { createAuthProvider } from './createAuthProvider.js';
import { httpAuthAdapter } from './adapters/httpAuthAdapter.js';
import { mockAuthAdapter } from './adapters/mockAuthAdapter.js';
import { USE_HTTP_API } from '../../api/runtime.js';

export const authProvider = createAuthProvider(USE_HTTP_API ? httpAuthAdapter : mockAuthAdapter);
