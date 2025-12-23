import { setupServer } from 'msw/node';
import { staysApiHandlers } from './handlers/staysApi.handlers';

// Setup MSW server with all handlers
export const server = setupServer(...staysApiHandlers);
