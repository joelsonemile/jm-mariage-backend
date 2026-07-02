const { Parser } = require("json2csv");

function guestsToCsv(rows) {
  const parser = new Parser({
    fields: [
      { label: "Nom", value: "fullName" },
      { label: "Email", value: "email" },
      { label: "Téléphone", value: "phone" },
      { label: "Lien avec le couple", value: "linkToCouple" },
      { label: "RSVP", value: "rsvpStatus" },
      { label: "Table", value: "tableName" },
      { label: "Place", value: "seatNumber" },
      { label: "Statut réservation", value: "reservationStatus" },
    ],
  });
  return parser.parse(rows);
}

module.exports = { guestsToCsv };
