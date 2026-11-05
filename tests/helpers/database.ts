import sql, { NVarChar } from 'mssql';
import { testConfig } from '../config';
import test from 'node:test';

const config = testConfig.database;
const employeeNoPrefix = testConfig.tblConfiguration.employeePrefix;
const authKey = testConfig.api.validAuthKey;
const serverInsrtTime = testConfig.api.serverInsrtTime;
const dtStart = testConfig.api.dtStart;
const dtEnd = testConfig.api.dtEnd;
const readerNames = testConfig.readerNames.valid;

const buildEmployeePrefixClause = (): string => {
  const prefixes = employeeNoPrefix
    .split(',')
    .map(prefix => prefix.trim())
    .filter(Boolean);

  if (!prefixes.length) {
    return '';
  }

  return `(${prefixes
    .map(prefix => `EmplId LIKE '${prefix.replace(/'/g, "''")}%'`)
    .join(' OR ')})`;
};

const buildWhereClause = (...conditions: string[]): string =>
  conditions.filter(Boolean).join(' AND ');

/**
 * Cleans up FilterReaders table for the configured authKey by deleting all records
 */
export const cleanupFilterReaders = async (): Promise<void> => {
  const pool = await sql.connect(config);
  try {
    await pool.request()
      .input('authKey', sql.NVarChar, authKey)
      .query(`DELETE FROM dbo.FilterReaders WHERE AuthKey = @authKey`);
  } finally {
    await pool.close();
  }
};

export const setupemployeePrefix = async (): Promise<void> => {
  const pool = await sql.connect(config);
  try {
    await pool.request()
      .input('authKey', sql.NVarChar, authKey)
      .input('employeePrefix', sql.NVarChar, employeeNoPrefix)
      .query(`UPDATE dbo.tblConfiguration set txtConfigValue=@employeePrefix
        WHERE txtConfigType = (SELECT txtConfigType from dbo.tblConfiguration WHERE txtConfigValue = @authKey) 
        AND txtConfigName = 'EmployeeNoPrefix'`);
  } finally {
    await pool.close();
  }
};

/**
 * Queries FilterReaders table to retrieve all active reader names for the configured authKey
 * @returns Array of reader names
 */
export const queryFilterReaders = async (): Promise<string[]> => {
  const pool = await sql.connect(config);
  try {
    const result = await pool.request()
      .input('authKey', sql.NVarChar, authKey)
      .query(`
        SELECT ReaderName
        FROM dbo.FilterReaders
        WHERE AuthKey = @authKey AND isActive = 1
      `);
    return result.recordset.map(r => r.ReaderName);
  } finally {
    await pool.close();
  }
};

export const queryWithServerInsertTime = async (): Promise<any> => {
  const pool = await sql.connect(config);
  try {
    const readers = readerNames.map(reader => `'${reader}'`).join(",");
    const whereClause = buildWhereClause(
      `ReaderName IN (${readers})`,
      `serverInsrtTime > '${serverInsrtTime}'`,
      `EmplId <> ''`,
      `EmplId IS NOT NULL`,
      buildEmployeePrefixClause(),
    );

    const result = await pool.request()
      .query(`
        SELECT *
        FROM pacsEventdata
        WHERE ${whereClause}
      `);
    return result;
  } finally {
    await pool.close();
  }
};

export const queryWithEventDateLocalTime = async (readerNames?: string[]): Promise<any> => {
  const pool = await sql.connect(config);
  try {
    if (readerNames) {
      const readers = readerNames.map(reader => `'${reader}'`).join(",");
      const whereClause = buildWhereClause(
        `ReaderName IN (${readers})`,
        `EventDateLocalTime BETWEEN '${dtStart}' and '${dtEnd}'`,
        `EmplId <> ''`,
        `EmplId IS NOT NULL`,
        buildEmployeePrefixClause(),
      );

      const result = await pool.request()
        .query(`
          SELECT *
          FROM pacsEventdata
          WHERE ${whereClause}
        `);
      return result;
    }

    const whereClause = buildWhereClause(
      `EventDateLocalTime BETWEEN '${dtStart}' and '${dtEnd}'`,
      `EmplId <> ''`,
      `EmplId IS NOT NULL`,
      buildEmployeePrefixClause(),
    );

    const result = await pool.request()
      .query(`
        SELECT *
        FROM pacsEventdata
        WHERE ${whereClause}
      `);
    return result;
  } finally {
    await pool.close();
  }
};