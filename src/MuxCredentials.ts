import { is, where } from 'ramda';

export interface MuxCredentials {
  id: string;
  secret: string;
}

export const isMuxCredentials = (input: unknown): input is MuxCredentials => where({
  id: is(String),
  secret: is(String),
})(input);
