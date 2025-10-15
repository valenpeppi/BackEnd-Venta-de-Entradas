import type { Config } from 'jest';
import dotenv from 'dotenv';

// Fuerza a Jest a cargar las variables del entorno de test
dotenv.config({ path: '.env.test' });

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],

  // Extensiones permitidas
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Transforma TypeScript
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // 👇 Ejecuta código antes de correr los tests
  //setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Más detallado
  verbose: true,
};

export default config;