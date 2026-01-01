import { setupStartHandlers } from './start.js';
import { setupAgreementHandlers } from './agreement.js';
import { setupMainHandlers } from './main.js';
import { setupAdminHandlers } from './admin.js';

export function setupAllHandlers(bot) {
  setupStartHandlers(bot);
  setupAgreementHandlers(bot);
  setupMainHandlers(bot);
  setupAdminHandlers(bot);
}

export * from './start.js';
export * from './agreement.js';
export * from './main.js';
export * from './admin.js';