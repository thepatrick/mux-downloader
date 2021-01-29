import { GetParameterCommand } from "@aws-sdk/client-ssm";
import { keyPath, ssm } from "./index";
import { MuxCredentials, isMuxCredentials } from "./MuxCredentials";

export const getMuxCredentials = async (): Promise<MuxCredentials> => {
  const g = new GetParameterCommand({ Name: keyPath, WithDecryption: true });

  const parameter = await ssm.send(g);

  const value = await parameter.Parameter?.Value;

  if (!value) {
    throw new Error('No value for ' + keyPath);
  }

  try {
    const parsed = JSON.parse(value);

    if (!isMuxCredentials(parsed)) {
      throw new Error('Crednetials must have id and secret');
    }

    return parsed;
  } catch (err) {
    throw new Error('Unable to parse ' + keyPath + ': ' + (err as Error).message);
  }
};
