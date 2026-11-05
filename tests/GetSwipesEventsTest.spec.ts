import { test, expect, type APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { cleanupFilterReaders, setupemployeePrefix } from './helpers/database';
import { testConfig } from './config';
import {queryWithServerInsertTime} from "./helpers/database"

const baseURL = testConfig.api.baseUrl;
const employeePrefix = testConfig.tblConfiguration.employeePrefix;
const validAuthKey = testConfig.api.validAuthKey;
const invalidAuthKey = testConfig.api.invalidAuthKey;
const serialNo = testConfig.api.serialNo;
const serverInsrtTime = testConfig.api.serverInsrtTime;
const validReaderNames = testConfig.readerNames.valid;

const getSwipesEventsUrl = `${baseURL}/api/ACSEventsLog/GetSwipesEvents`;
const saveReaderFiltersUrl = `${baseURL}/api/ACSEventsLog/SaveReaderFilters`;

const sendRequest = async (request: APIRequestContext, url: string, authKey?: string, body?: any) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (authKey) headers.AuthKey = authKey;
  const response = await request.post(url, { headers, data: body });
  return response;
};

const saveJsonOutput = (fileName: string, data: unknown) => {
  const outputDir = path.resolve(__dirname, '../test-results');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
  return outputPath;
};

test.beforeAll(async ({ request }) => {
  await setupemployeePrefix();
  await cleanupFilterReaders();

  const setupResponse = await sendRequest(request, saveReaderFiltersUrl, validAuthKey, {
    readerNames: validReaderNames,
  });

  expect(setupResponse.status()).toBe(200);
  const setupBody = await setupResponse.json();
  expect(setupBody.code).toBe(0);
  expect(setupBody.message).toContain('Reader filters saved successfully');
});

test.describe('GetSwipesEvents API', () => {
  test('test api with serialNo', async ({ request }, testInfo) => {
    const response = await sendRequest(request, getSwipesEventsUrl, validAuthKey, {
      serialNo: serialNo.toString(),
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.code).toBe(0);
      const outputPath = saveJsonOutput('swipesForSerialNo.json', body);
      await testInfo.attach('Valid Auth Swipe Events JSON', {
        path: outputPath,
        contentType: 'application/json',
      });
      console.log(`Saved swipes events JSON to: ${outputPath}`);
      expect(body.events[0]).toHaveProperty('companyName');
      for(let event of body.events)
      {
        expect(Number(event.serialNo)).toBeGreaterThan(serialNo);
      }
      testInfo.attach("Only records above the serial number : " + serialNo + " are returned.");

      for(let event of body.events)
      {
        expect(validReaderNames).toContain(event.readerName);
      }
      testInfo.attach("Only events with registered reader names are returned by the API.");
      // expect(body.message).toContain('Successfully received the data');
      // expect(Array.isArray(body.events)).toBe(true);
    }
    console.log(`Response status for valid AuthKey: ${response.status()}`);
  });

  test('test API with dtStart', async ({ request }, testInfo) => {
    const response = await sendRequest(request, getSwipesEventsUrl, validAuthKey, {
      dtStart: serverInsrtTime
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.code).toBe(0);
      const outputPath = saveJsonOutput('swipesForServerInstTime.json', body);
      await testInfo.attach('Valid Auth Swipe Events JSON', {
        path: outputPath,
        contentType: 'application/json',
      });
      console.log(`Saved swipes events JSON to: ${outputPath}`);
      expect(body.events[0]).toHaveProperty('companyName');
      const result = await queryWithServerInsertTime();
      const count = result.recordset.length;
      expect (body.events.length).toBe(count);
      testInfo.attach("Count with serverInsrtTime > "+ serverInsrtTime +" = "+count+".\n"+ "Count of records recieved from API = "+body.events.length+".\n")
      for(let event of body.events)
      {
        expect(validReaderNames).toContain(event.readerName);
      }
      testInfo.attach("Only events with registered reader names are returned by the API.");

      // expect(body.message).toContain('Successfully received the data');
      // expect(Array.isArray(body.events)).toBe(true);
    }
    console.log(`Response status for valid AuthKey: ${response.status()}`);
  });

  test('should return 401 for invalid AuthKey', async ({ request }) => {
    const response = await sendRequest(request, getSwipesEventsUrl, invalidAuthKey, {
      serialNo: serialNo.toString(),
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.code).toBe(401);
    } else {    
      expect([400, 401]).toContain(response.status());
    }
    console.log(`Response status for invalid AuthKey: ${response.status()}`);
  });
});
