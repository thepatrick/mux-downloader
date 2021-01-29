import { stat } from "fs/promises";

export const needDownload = async (dest: string, size: number) => {
  try {
    const stats = await stat(dest);

    return stats.size === size;
  } catch (err) {
    return true;
  }
};
