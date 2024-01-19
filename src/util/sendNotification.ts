import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { getConfig, log } from '@danielhammerl/nodejs-service-framework';
import { HostState } from '@danielhammerl/pi-monitoring-api';

const getMailer = () => {
  try {
    return nodemailer.createTransport({
      host: getConfig('email.host'),
      port: getConfig('email.port'),
      secure: true,
      auth: {
        user: getConfig('email.username'),
        pass: getConfig('email.password'),
      },
    } as SMTPTransport.Options);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    log('error', 'Failed to init nodemailer', e);
    throw e;
  }
};

export const sendMail = async (hostId: string, hostName: string, status: HostState): Promise<void> => {
  const mail = {
    from: process.env['EMAIL_USERNAME'],
    to: 'mail@danielhammerl.de',
    subject: `Client Monitoring: ${hostName} - ${status === 'FAILURE' ? 'DOWN' : 'UP AGAIN'}`,
    html: `<h1>Client Monitoring: ${hostName} is ${status === 'FAILURE' ? 'DOWN' : 'UP AGAIN'}</h1>`,
  };
  const mailer = await getMailer();
  mailer.sendMail(mail, (error) => {
    if (error) {
      log('error', `Failed to send an email notification`, { metadata: error });
    }
  });
};
