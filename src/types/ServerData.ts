import { RegisteredHost } from './RegisteredHost';
import { Settings } from './Settings';

export type ServerData = {
  registeredHosts: RegisteredHost[];
  settings: Settings;
};
