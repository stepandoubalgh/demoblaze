import { test, expect } from '../../src/fixtures/test-fixtures';
import type { BookingData } from '../../src/models/booking.model';

/** Sample booking payload used for the happy-path integration scenario. */
const bookingData: BookingData = {
  firstname: 'Milena',
  lastname: 'Stranska',
  totalprice: 1500,
  depositpaid: true,
  bookingdates: {
    checkin: '2026-08-14',
    checkout: '2026-08-19',
  },
  additionalneeds: 'Breakfast',
};

test.describe('Restful-Booker integration - happy path', () => {
  test('creates a booking and reads it back unchanged', async ({ bookingApiClient }) => {
    const bookingId = await test.step('Create a booking (POST /booking)', async () => {
      const response = await bookingApiClient.createBooking(bookingData);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.bookingid).toEqual(expect.any(Number));
      expect(body.booking).toEqual(bookingData);

      return body.bookingid as number;
    });

    await test.step('Read the booking back (GET /booking/{id}) and verify it matches', async () => {
      const response = await bookingApiClient.getBooking(bookingId);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toEqual(bookingData);
    });
  });
});
