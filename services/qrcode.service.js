const QRCode = require("qrcode");

// Encode l'identifiant de réservation dans le QR : suffisant pour une vérification
// visuelle à l'entrée le jour J, sans dépendance à un service tiers.
async function generateQrDataUrl(reservationId) {
  const payload = JSON.stringify({ reservationId: reservationId.toString() });
  return QRCode.toDataURL(payload, {
    margin: 1,
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
    width: 320,
  });
}

async function generateQrBuffer(reservationId) {
  const payload = JSON.stringify({ reservationId: reservationId.toString() });
  return QRCode.toBuffer(payload, {
    margin: 1,
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
    width: 320,
  });
}

// Un seul QR pour tout le ticket d'un invité, même s'il a réservé plusieurs
// places : encode le compte et l'ensemble de ses réservations validées.
async function generateGroupQrDataUrl(guestId, reservationIds) {
  const payload = JSON.stringify({
    guestId: guestId.toString(),
    reservationIds: reservationIds.map((id) => id.toString()),
  });
  return QRCode.toDataURL(payload, {
    margin: 1,
    color: { dark: "#0A0A0A", light: "#FFFFFF" },
    width: 320,
  });
}

module.exports = { generateQrDataUrl, generateQrBuffer, generateGroupQrDataUrl };
