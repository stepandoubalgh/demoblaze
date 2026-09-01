import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { BookingData, CreateBookingResponse, GetBookingResponse } from '../models/booking.model';

/**
 * Thin, typed wrapper around Playwright's `APIRequestContext` for the
 * Restful-Booker API. Keeps HTTP concerns (endpoints, headers, JSON
 * parsing) out of the test files, mirroring the separation of concerns
 * that the UI Page Objects provide.
 */
export class BookingApiClient {
  private readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Creates a new booking.
   *
   * @param bookingData payload to send to `POST /booking`
   * @returns the raw APIResponse, left for the caller to assert on
   *          (status, headers) as well as parse
   */
  async createBooking(bookingData: BookingData): Promise<APIResponse> {
    return this.request.post('/booking', { data: bookingData });
  }

  /**
   * Fetches a booking by id.
   *
   * @param bookingId id returned by a previous {@link createBooking} call
   */
  async getBooking(bookingId: number): Promise<APIResponse> {
    return this.request.get(`/booking/${bookingId}`, {
      headers: { Accept: 'application/json' },
    });
  }

  /** Convenience helper: creates a booking and returns the parsed JSON body. */
  async createBookingJson(bookingData: BookingData): Promise<CreateBookingResponse> {
    const response = await this.createBooking(bookingData);
    return response.json();
  }

  /** Convenience helper: fetches a booking and returns the parsed JSON body. */
  async getBookingJson(bookingId: number): Promise<GetBookingResponse> {
    const response = await this.getBooking(bookingId);
    return response.json();
  }
}
