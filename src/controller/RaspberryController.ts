import express from 'express';
import ash from 'express-async-handler';
import {
  AuthenticatedRequest,
  AuthenticationHandler,
  NotFoundException,
  UnauthorizedException,
  ValidationException,
} from '@danielhammerl/nodejs-service-framework';
import { database, defaultServerData, serverDataSchema } from '../util/db';
import { Permission } from '@danielhammerl/user-service-api';
import { v4 as uuidv4 } from 'uuid';
import { ServerData, RegisteredHost } from '@danielhammerl/pi-monitoring-api';

const router = express.Router();

/**
 * raspberry pi send heartbeat to monitoring server
 */
router.post(
  '/heartbeat/${id}',
  AuthenticationHandler,
  ash(async (req, res) => {
    if (!(req as AuthenticatedRequest).permissions?.includes(Permission.REGISTER_TO_PI_MONITORING_SERVER)) {
      throw new UnauthorizedException();
    }

    const currentData = (await database.getData(defaultServerData, {})) ?? defaultServerData;
    const hostWithId = currentData.registeredHosts.find((item) => item.id === req.params.id);
    if (!hostWithId) {
      throw new NotFoundException();
    }
    const otherHosts = currentData.registeredHosts.filter((item) => item.id !== req.params.id);
    const newData: ServerData = {
      ...currentData,
      registeredHosts: [...otherHosts, hostWithId],
    };
    await database.saveData(newData, { exposeExceptions: true });
    return res.status(200).json({});
  })
);

/**
 * get settings
 */
router.get(
  '/settings',
  AuthenticationHandler,
  ash(async (req, res) => {
    if (!(req as AuthenticatedRequest).permissions?.includes(Permission.ADMIN)) {
      throw new UnauthorizedException();
    }
    const data = await database.getData(defaultServerData, {
      saveDefaultDataOnError: true,
    });
    return res.status(200).json(data?.settings ?? defaultServerData.settings);
  })
);

/**
 * write settings
 */
router.put(
  '/settings',
  AuthenticationHandler,
  ash(async (req, res) => {
    if (!(req as AuthenticatedRequest).permissions?.includes(Permission.ADMIN)) {
      throw new UnauthorizedException();
    }
    const settings = req.body;
    const currentData = (await database.getData(defaultServerData, {})) ?? defaultServerData;
    try {
      serverDataSchema.validateSync({ ...currentData, settings: settings });
    } catch (e: unknown) {
      throw new ValidationException(e as Error);
    }
    await database.saveData({ ...currentData, settings: settings }, { exposeExceptions: true });
    return res.status(200).json({});
  })
);

/**
 * raspberry pi can register to monitoring server
 */
router.post(
  '/register',
  AuthenticationHandler,
  ash(async (req, res) => {
    if (!(req as AuthenticatedRequest).permissions?.includes(Permission.REGISTER_TO_PI_MONITORING_SERVER)) {
      throw new UnauthorizedException();
    }

    const newHost = req.body;
    newHost.id = uuidv4();

    const currentData = (await database.getData(defaultServerData, {})) ?? defaultServerData;
    const newData: ServerData = {
      ...currentData,
      registeredHosts: [...currentData.registeredHosts, newHost as RegisteredHost],
    };
    try {
      serverDataSchema.validateSync(currentData);
    } catch (e: unknown) {
      throw new ValidationException(e as Error);
    }
    await database.saveData(newData, { exposeExceptions: true });
    return res.status(201).json(newHost);
  })
);

/**
 * raspberry pi can unregister of monitoring server
 */
router.post(
  '/unregister/${id}',
  AuthenticationHandler,
  ash(async (req, res) => {
    if (!(req as AuthenticatedRequest).permissions?.includes(Permission.REGISTER_TO_PI_MONITORING_SERVER)) {
      throw new UnauthorizedException();
    }

    const id = req.params.id;
    const currentData = (await database.getData(defaultServerData, {})) ?? defaultServerData;
    const newData: ServerData = {
      ...currentData,
      registeredHosts: currentData.registeredHosts.filter((item) => item.id === id),
    };
    try {
      serverDataSchema.validateSync(newData);
    } catch (e: unknown) {
      throw new ValidationException(e as Error);
    }

    await database.saveData(newData, { exposeExceptions: true });
    return res.status(200).json({});
  })
);

/**
 * get status of registered raspberries
 */
router.get(
  '/status',
  AuthenticationHandler,
  ash(async (req, res) => {
    if (!(req as AuthenticatedRequest).permissions?.includes(Permission.READ_PI_MONITORING_STATUS)) {
      throw new UnauthorizedException();
    }

    const currentData = (await database.getData(defaultServerData, {})) ?? defaultServerData;
    return res.status(200).json(currentData.registeredHosts);
  })
);

export default router;
