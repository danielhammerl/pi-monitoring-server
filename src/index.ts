import { App, InitApplication } from '@danielhammerl/nodejs-service-framework';
import RaspberryController from './controller/RaspberryController';

InitApplication({
  serviceName: 'Pi Monitoring Server',
  connectToServiceRegistry: true,
  // eslint-disable-next-line require-await
  beforeStartMethod: async (app: App): Promise<void> => {
    app.use('/', RaspberryController);
  },
});
