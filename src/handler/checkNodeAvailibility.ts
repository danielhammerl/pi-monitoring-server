import { database, defaultServerData } from '../util/db';
import { sendMail } from '../util/sendNotification';
import { RegisteredHost, ServerData } from '@danielhammerl/pi-monitoring-api';

const ONE_MIN_AND_ONE_S_IN_MS = 60 * 1000 + 1000;

const checkNodes = async () => {
  const currentData = (await database.getData(defaultServerData, {})) ?? defaultServerData;
  const { registeredHosts } = currentData;
  const newRegisteredHosts: RegisteredHost[] = registeredHosts.map((host) => {
    if (new Date().getTime() - host.lastSignOfLife.getTime() > ONE_MIN_AND_ONE_S_IN_MS * 5) {
      if (host.lastState === 'UP' || !host.lastState) {
        // last sign of life is more than 5 minutes ago
        sendMail(host.id, host.name, 'FAILURE');
      }

      return {
        ...host,
        lastState: 'FAILURE',
      };
    } else {
      if (host.lastState === 'FAILURE') {
        sendMail(host.id, host.name, 'UP_AGAIN');

        return {
          ...host,
          lastState: 'UP_AGAIN',
        };
      } else {
        return {
          ...host,
          lastState: 'UP',
        };
      }
    }
  });

  const newData: ServerData = {
    ...currentData,
    registeredHosts: newRegisteredHosts,
  };
  await database.saveData(newData, { exposeExceptions: true });
};

export const initChecking = (): void => {
  setInterval(() => checkNodes(), ONE_MIN_AND_ONE_S_IN_MS);
};
