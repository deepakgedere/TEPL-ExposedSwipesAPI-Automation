import { test, expect, type APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { cleanupFilterReaders, setupemployeePrefix,queryWithEventDateLocalTime } from './helpers/database';
import { testConfig } from './config';

const baseURL = testConfig.api.baseUrl;
const employeePrefix = testConfig.tblConfiguration.employeePrefix;
const validAuthKey = testConfig.api.validAuthKey;
const invalidAuthKey = testConfig.api.invalidAuthKey;
const dtStart = testConfig.api.dtStart;
const dtEnd = testConfig.api.dtEnd;
const validReaderNames = testConfig.readerNames.valid;

const getSwipesByEventDateTimeUrl = `${baseURL}/api/ACSEventsLog/GetSwipesEventsByEventDateTime`;
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



test.describe('GetSwipesEventsByEventDateTime API with registered readers', () => {

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

  test('test API with valid authkey', async ({ request }, testInfo) => {
    const response = await sendRequest(request, getSwipesByEventDateTimeUrl, validAuthKey, {
      dtStart: dtStart,
      dtEnd: dtEnd
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.code).toBe(0);
      const outputPath = saveJsonOutput('swipesForEventDateLocalTime.json', body);
      await testInfo.attach('Valid Auth Swipe Events JSON', {
        path: outputPath,
        contentType: 'application/json',
      });
      console.log(`Saved swipes events JSON to: ${outputPath}`);
      expect(body.events[0]).toHaveProperty('companyName');
      const result = await queryWithEventDateLocalTime(validReaderNames);
      const count = result.recordset.length;
      expect (body.events.length).toBe(count);
      testInfo.attach("Count with EventDateLocalTime between "+ dtStart +" and "+ dtEnd +" = "+count+".\n"+ "Count of records recieved from API = "+body.events.length+".\n")
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
    const response = await sendRequest(request, getSwipesByEventDateTimeUrl, invalidAuthKey, {
      dtStart: dtStart,
      dtEnd: dtEnd
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

test.describe('GetSwipesEventsByEventDateTime API without registered readers', () => {

  test.beforeAll(async ({ request }) => {
    await setupemployeePrefix();
    await cleanupFilterReaders();
  });

  test('should return all readers records when no readers are registered for the client', async ({request}, testInfo) => {
    const response = await sendRequest(request, getSwipesByEventDateTimeUrl, validAuthKey, {
      dtStart: dtStart,
      dtEnd: dtEnd
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.code).toBe(0);
      const outputPath = saveJsonOutput('swipesForEventDateLocalTime.json', body);
      await testInfo.attach('Valid Auth Swipe Events JSON', {
        path: outputPath,
        contentType: 'application/json',
      });
      console.log(`Saved swipes events JSON to: ${outputPath}`);
      const result = await queryWithEventDateLocalTime();
      const count = result.recordset.length;
      expect (body.events.length).toBe(count);
      testInfo.attach("Count with EventDateLocalTime between "+ dtStart +" and "+ dtEnd +" = "+count+".\n"+ "Count of records recieved from API = "+body.events.length+".\n")
    }
    console.log(`Response status for valid AuthKey: ${response.status()}`);
  });

});