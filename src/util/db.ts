import { FileDatabase } from '@danielhammerl/nodejs-service-framework';
import * as yup from 'yup';
import { ServerData } from '../types/ServerData';

export const serverDataSchema = yup.object().shape({
  registeredHosts: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.string().required(),
        name: yup.string().required(),
      })
    )
    .required(),
  settings: yup
    .object()
    .shape({
      disableNotifications: yup.boolean(),
    })
    .required(),
});

export const defaultServerData: ServerData = {
  registeredHosts: [],
  settings: {
    disableNotifications: false,
  },
};

export const database = new FileDatabase<ServerData>({ validationSchema: serverDataSchema });
