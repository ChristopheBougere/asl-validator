import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
  return {
    preset: 'ts-jest',
    testMatch: ['<rootDir>/**/__tests__/**/*.test.ts'],
  };
};
