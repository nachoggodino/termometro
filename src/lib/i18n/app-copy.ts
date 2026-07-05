import { messages as esMessages } from "./messages/es";

export const defaultAppCopy = {
  title: esMessages.meta.title,
  description: esMessages.meta.description,
  shortName: esMessages.common.shortName,
} as const;
