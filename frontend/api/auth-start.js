// El admin visita esta URL una sola vez para autorizar la integración Kommo.
// URL: https://tu-app.vercel.app/api/auth-start
export default function handler(req, res) {
  const { KOMMO_CLIENT_ID, KOMMO_SUBDOMAIN, KOMMO_REDIRECT_URI } = process.env
  const params = new URLSearchParams({
    client_id:    KOMMO_CLIENT_ID,
    state:        'kommo_inbox_auth',
    mode:         'post_message',
    redirect_uri: KOMMO_REDIRECT_URI,
  })
  res.redirect(302, `https://${KOMMO_SUBDOMAIN}.kommo.com/oauth2/authorize?${params}`)
}
