export const bookingCodeExample=`// Synthetic example. No mission completion is awarded by running it.
function book(request, bookings) {
  const rows = bookings.slice();
  let status;
  if (request.pending) status = 102;
  else if (request.networkFailure) status = 0;
  else if (request.fail) status = 503;
  else if (!request.name.trim() || !/^\\d{10}$/.test(request.phone)) status = 400;
  else if (rows.some(row => row.slot === request.slot)) status = 409;
  else { status = 201; rows.push({ slot: request.slot, name: request.name, phone: request.phone }); }
  return {status, message: "Booking saved", bookings: rows, draftKept: status !== 201};
}`;
export const bookingCorrectedExample=bookingCodeExample.replace('message: "Booking saved"','message: status === 201 ? "Booking saved" : status === 102 ? "Saving…" : "Could not save"');
