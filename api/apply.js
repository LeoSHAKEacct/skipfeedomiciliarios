const REQUIRED_FIELDS = [
  'fullName',
  'documentType',
  'documentNumber',
  'phone',
  'vehicleType',
  'paymentMethod',
  'paymentAccount',
  'agreementSignature',
];

function makeRadicado() {
  const time = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.floor(10 + Math.random() * 90);
  return `SKF-${time}${rand}`;
}

async function notifyEmail(row) {
  const key = process.env.WEB3FORMS_KEY;
  if (!key) return;

  const summary = [
    `Radicado: ${row.radicado}`,
    `Nombre: ${row.full_name}`,
    `Documento: ${row.document_type} ${row.document_number}`,
    `Telefono: ${row.phone}`,
    `Email: ${row.email || '-'}`,
    `Direccion: ${row.address || '-'} (${row.neighborhood || '-'}, ${row.city || '-'})`,
    `Vehiculo: ${row.vehicle_type}${row.plate ? ' - placa ' + row.plate : ''}`,
    `Disponibilidad: ${row.availability ? JSON.stringify(row.availability) : '-'}`,
    `EPS: ${row.eps || '-'}  ARL: ${row.arl || '-'}`,
    `Contacto emergencia: ${row.emergency_contact_name || '-'} (${row.emergency_contact_phone || '-'})`,
    `Pago: ${row.payment_method} - ${row.payment_account}`,
    `Firma electronica: ${row.agreement_signature}`,
    `Aceptado: ${row.agreement_accepted_at}`,
  ].join('\n');

  try {
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: key,
        subject: `Nueva solicitud domiciliario Skipfee — ${row.radicado}`,
        from_name: 'Skipfee Domiciliarios',
        Radicado: row.radicado,
        Nombre: row.full_name,
        Resumen: summary,
      }),
    });
  } catch (err) {
    console.error('web3forms_notify_failed', err);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  let data;
  try {
    data = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
  } catch {
    res.status(400).json({ ok: false, error: 'invalid_json' });
    return;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!data[field] || String(data[field]).trim() === '') {
      res.status(400).json({ ok: false, error: `missing_field:${field}` });
      return;
    }
  }

  if (!data.agreementAccepted || !data.consentData || !data.consentContract || !data.consentTruth) {
    res.status(400).json({ ok: false, error: 'agreement_not_accepted' });
    return;
  }

  const signatureOk =
    String(data.agreementSignature).trim().toLowerCase() === String(data.fullName).trim().toLowerCase();
  if (!signatureOk) {
    res.status(400).json({ ok: false, error: 'signature_mismatch' });
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('missing_supabase_env');
    res.status(500).json({ ok: false, error: 'server_not_configured' });
    return;
  }

  const radicado = makeRadicado();
  const nowIso = new Date().toISOString();

  const row = {
    radicado,
    full_name: String(data.fullName).trim(),
    document_type: data.documentType,
    document_number: String(data.documentNumber).trim(),
    birth_date: data.birthDate || null,
    phone: String(data.phone).trim(),
    email: data.email ? String(data.email).trim() : null,
    address: data.address || null,
    neighborhood: data.neighborhood || null,
    city: data.city || 'Medellín',
    vehicle_type: data.vehicleType,
    plate: data.plate || null,
    license_number: data.licenseNumber || null,
    soat_expiry: data.soatExpiry || null,
    tecnomecanica_expiry: data.tecnomecanicaExpiry || null,
    availability: data.availability || null,
    eps: data.eps || null,
    arl: data.arl || null,
    emergency_contact_name: data.emergencyContactName || null,
    emergency_contact_phone: data.emergencyContactPhone || null,
    payment_method: data.paymentMethod,
    payment_account: String(data.paymentAccount).trim(),
    agreement_accepted: true,
    agreement_signature: String(data.agreementSignature).trim(),
    agreement_accepted_at: nowIso,
    raw: data,
  };

  try {
    const supaResp = await fetch(`${SUPABASE_URL}/rest/v1/skipfee_applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });

    if (!supaResp.ok) {
      const errText = await supaResp.text();
      console.error('supabase_insert_failed', supaResp.status, errText);
      res.status(502).json({ ok: false, error: 'storage_failed' });
      return;
    }
  } catch (err) {
    console.error('supabase_insert_exception', err);
    res.status(502).json({ ok: false, error: 'storage_failed' });
    return;
  }

  await notifyEmail(row);

  res.status(200).json({ ok: true, radicado });
};
