/** Check-in/check-out dates for a Restful-Booker reservation. */
export interface BookingDates {
  checkin: string;
  checkout: string;
}

/** Request payload accepted by `POST /booking`. */
export interface BookingData {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

/** Response body returned by `POST /booking`. */
export interface CreateBookingResponse {
  bookingid: number;
  booking: BookingData;
}

/** Response body returned by `GET /booking/{id}`. */
export type GetBookingResponse = BookingData;
