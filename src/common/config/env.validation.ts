import { plainToInstance } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

class EnvVars {
  @IsString()
  NODE_ENV!: string;

  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  API_KEY!: string;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  REDIS_URL!: string;

  @IsString()
  TBANK_TERMINAL_KEY!: string;

  @IsString()
  TBANK_PASSWORD!: string;

  @IsString()
  TBANK_BASE_URL!: string;

  @IsString()
  PUBLIC_WEBHOOK_URL!: string;

  @IsString()
  AFTER_PAYMENT_CALLBACK_URL!: string;

  @IsOptional()
  @IsString()
  CALLBACK_HMAC_SECRET?: string;
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const picked = {
    NODE_ENV: config.NODE_ENV,
    PORT: config.PORT,
    API_KEY: config.API_KEY,
    DATABASE_URL: config.DATABASE_URL,
    REDIS_URL: config.REDIS_URL,
    TBANK_TERMINAL_KEY: config.TBANK_TERMINAL_KEY,
    TBANK_PASSWORD: config.TBANK_PASSWORD,
    TBANK_BASE_URL: config.TBANK_BASE_URL,
    PUBLIC_WEBHOOK_URL: config.PUBLIC_WEBHOOK_URL,
    AFTER_PAYMENT_CALLBACK_URL: config.AFTER_PAYMENT_CALLBACK_URL,
    CALLBACK_HMAC_SECRET: config.CALLBACK_HMAC_SECRET
  };

  const transformed = plainToInstance(EnvVars, {
    ...picked,
    PORT: picked.PORT ? Number(picked.PORT) : 3000
  });

  const errors = validateSync(transformed, { whitelist: true, forbidNonWhitelisted: false });
  if (errors.length > 0) {
    const message = errors.map((e) => JSON.stringify(e.constraints)).join('\n');
    throw new Error(`Env validation error:\n${message}`);
  }

  return transformed as any;
}
