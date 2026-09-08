import { LoggerService } from "../services/LoggerService";

export function setupGlobalLogger() {
  const logger = new LoggerService();
  logger.setup();
}
