import testConfigData from '../config/test-config.json';

const baseConfig = testConfigData as {
  api: {
    baseUrl: string;
    validAuthKey: string;
    invalidAuthKey: string;
    serialNo: number;
    serverInsrtTime: string;
    dtStart: string;
    dtEnd: string;
  };
  "tblConfiguration":{
    "EmployeeNoPrefix" : string;
  },
  database: {
    user: string;
    password: string;
    server: string;
    port: number;
    database: string;
    options: {
      instanceName: string;
      encrypt: boolean;
      trustServerCertificate: boolean;
    };
  };
  readerNames: {
    valid: string[];
    single: string[];
    initial: string[];
    updated: string[];
    special: string[];
    duplicate: string[];
    empty: string[];
    largePrefix: string;
    largeCount: number;
  };
};

export const testConfig = {
  api: {
    baseUrl: process.env.API_BASE_URL ?? baseConfig.api.baseUrl,
    validAuthKey: process.env.VALID_AUTH_KEY ?? baseConfig.api.validAuthKey,
    invalidAuthKey: process.env.INVALID_AUTH_KEY ?? baseConfig.api.invalidAuthKey,
    serialNo: Number(process.env.SERIAL_NO ?? baseConfig.api.serialNo),
    serverInsrtTime: process.env.serverInsrtTime ?? baseConfig.api.serverInsrtTime,
    dtStart: process.env.dtStart ?? baseConfig.api.dtStart,
    dtEnd: process.env.dtEnd ?? baseConfig.api.dtEnd,

  },
  tblConfiguration:{
    employeePrefix : process.env.employeePrefix ?? baseConfig.tblConfiguration.EmployeeNoPrefix,
  },
  database: {
    user: process.env.DB_USER ?? baseConfig.database.user,
    password: process.env.DB_PASSWORD ?? baseConfig.database.password,
    server: process.env.DB_HOST ?? baseConfig.database.server,
    port: Number(process.env.DB_PORT ?? baseConfig.database.port),
    database: process.env.DB_NAME ?? baseConfig.database.database,
    options: {
      ...baseConfig.database.options,
    },
  },
  readerNames: {
    valid: baseConfig.readerNames.valid,
    single: baseConfig.readerNames.single,
    initial: baseConfig.readerNames.initial,
    updated: baseConfig.readerNames.updated,
    special: baseConfig.readerNames.special,
    duplicate: baseConfig.readerNames.duplicate,
    empty: baseConfig.readerNames.empty,
    largePrefix: baseConfig.readerNames.largePrefix,
    largeCount: baseConfig.readerNames.largeCount,
  },
};

export const buildLargeReaderNames = (
  prefix: string = testConfig.readerNames.largePrefix,
  count: number = testConfig.readerNames.largeCount,
): string[] => Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);
