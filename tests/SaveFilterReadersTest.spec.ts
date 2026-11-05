import { test, expect, type APIRequestContext } from '@playwright/test';
import { cleanupFilterReaders, queryFilterReaders } from './helpers/database';
import { buildLargeReaderNames, testConfig } from './config';

const baseURL = testConfig.api.baseUrl;
const validAuthKey = testConfig.api.validAuthKey;
const invalidAuthKey = testConfig.api.invalidAuthKey;

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

test.describe('SaveReaderFilters API', () => {
  test('saves valid reader names for a valid auth key', async ({ request }) => {
    // Cleanup before test
    await cleanupFilterReaders();

    const response = await sendRequest(request, saveReaderFiltersUrl, validAuthKey, {
      readerNames: testConfig.readerNames.valid,
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.message).toContain('Reader filters saved successfully');

    // Verify in database
    const names = await queryFilterReaders();

    expect(names).toEqual(expect.arrayContaining(testConfig.readerNames.valid));
    expect(names).toHaveLength(testConfig.readerNames.valid.length);
  });

  test('should reject request without AuthKey', async ({ request }) => {
    // Cleanup before test
    await cleanupFilterReaders();

    const response = await sendRequest(request, saveReaderFiltersUrl, undefined, {
      readerNames: testConfig.readerNames.single,
    });
    expect([400, 401]).toContain(response.status());
    console.log(`Response status for missing AuthKey: ${response.status()}`);

    // Verify that no records were saved in database
    const names = await queryFilterReaders();
    expect(names).toHaveLength(0);
  });

  test('should reject invalid AuthKey', async ({ request }) => {
    // Cleanup before test
    await cleanupFilterReaders();

    const response = await sendRequest(request, saveReaderFiltersUrl, invalidAuthKey, {
      readerNames: testConfig.readerNames.single,
    });
    const body = await response.json();
    if (response.status() === 200) {
      expect(body.code).toBe(401);
    } else {
      expect([400, 401]).toContain(response.status());
    }
    console.log(`Response status for invalid AuthKey: ${response.status()}`);

    // Verify that no records were saved in database
    const names = await queryFilterReaders();
    expect(names).toHaveLength(0);
  });

  test('should reject empty readerNames array', async ({ request }) => {
    // Cleanup before test
    await cleanupFilterReaders();

    const response = await sendRequest(request, saveReaderFiltersUrl, validAuthKey, {
      readerNames: testConfig.readerNames.empty,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.code).toBe(1);
    expect(body.message).toContain('Please provide at least one ReaderName');
    console.log(`Response for empty readerNames: ${response.status()}`);

    // Verify that no records were saved in database
    const names = await queryFilterReaders();
    expect(names).toHaveLength(0);
  });

  test('should reject missing readerNames field', async ({ request }) => {
    // Cleanup before test
    await cleanupFilterReaders();

    const response = await sendRequest(request, saveReaderFiltersUrl, validAuthKey, {});
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.code).toBe(1);
    expect(body.message).toContain('Please provide at least one ReaderName');
    console.log(`Response for missing readerNames field: ${response.status()}`);

    // Verify that no records were saved in database
    const names = await queryFilterReaders();
    expect(names).toHaveLength(0);
  });

  test('should update filters - new readers replace old ones', async ({ request }) => {
    // Cleanup before test
    await cleanupFilterReaders();

    // Save initial set of readers
    const initialResponse = await sendRequest(request, saveReaderFiltersUrl, validAuthKey, {
      readerNames: testConfig.readerNames.initial,
    });
    expect(initialResponse.status()).toBe(200);
    let names = await queryFilterReaders();
    expect(names).toHaveLength(testConfig.readerNames.initial.length);
    expect(names).toEqual(expect.arrayContaining(testConfig.readerNames.initial));

    // Save new set of readers (should replace old ones)
    const updateResponse = await sendRequest(request, saveReaderFiltersUrl, validAuthKey, {
      readerNames: testConfig.readerNames.updated,
    });
    expect(updateResponse.status()).toBe(200);
    const updateBody = await updateResponse.json();
    expect(updateBody.code).toBe(0);
    expect(updateBody.message).toContain('Reader filters saved successfully');

    // Verify that old readers are replaced with new ones
    names = await queryFilterReaders();
    expect(names).toHaveLength(testConfig.readerNames.updated.length);
    expect(names).toEqual(expect.arrayContaining(testConfig.readerNames.updated));
    expect(names).not.toContain(testConfig.readerNames.initial[0]);
    expect(names).not.toContain(testConfig.readerNames.initial[1]);
  });

  test('should handle special characters in reader names', async ({ request }) => {
    // Cleanup before test
    await cleanupFilterReaders();

    const specialReaderNames = testConfig.readerNames.special;
    const response = await sendRequest(request, saveReaderFiltersUrl, validAuthKey, {
      readerNames: specialReaderNames,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.message).toContain('Reader filters saved successfully');

    // Verify all names with special characters were saved correctly
    const names = await queryFilterReaders();
    expect(names).toHaveLength(specialReaderNames.length);
    expect(names).toEqual(expect.arrayContaining(specialReaderNames));
  });

  test('should handle duplicate reader names in array', async ({ request }) => {
    // Cleanup before test
    await cleanupFilterReaders();

    const duplicateReaderNames = testConfig.readerNames.duplicate;
    const response = await sendRequest(request, saveReaderFiltersUrl, validAuthKey, {
      readerNames: duplicateReaderNames,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.message).toContain('Reader filters saved successfully');

    // Verify how the API handles duplicates
    const names = await queryFilterReaders();
    // API should save duplicates or handle them appropriately
    expect(names.length).toBe(2);
    expect(names).toEqual(expect.arrayContaining(['Reader_1', 'Reader_2']));
  });

  test('should handle large number of reader names', async ({ request }) => {
    // Cleanup before test
    await cleanupFilterReaders();

    const largeReaderArray = buildLargeReaderNames();
    const response = await sendRequest(request, saveReaderFiltersUrl, validAuthKey, {
      readerNames: largeReaderArray,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.code).toBe(0);
    expect(body.message).toContain('Reader filters saved successfully');

    // Verify all configured readers were saved
    const names = await queryFilterReaders();
    expect(names).toHaveLength(largeReaderArray.length);
    expect(names).toEqual(expect.arrayContaining(largeReaderArray));
  });
});