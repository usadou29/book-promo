/**
 * Génère le template HTML de l'email promotionnel pour un livre.
 */
export function generateEmailHtml(params: {
  book_title: string;
  cover_url: string;
  amazon_url: string;
  description: string;
}): string {
  const { book_title, cover_url, amazon_url, description } = params;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${book_title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Nouveau Livre Disponible !</h1>
            </td>
          </tr>

          <!-- Cover Image -->
          <tr>
            <td align="center" style="padding:30px 30px 20px;">
              <img src="${cover_url}" alt="${book_title}" style="max-width:250px;height:auto;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:0 30px 15px;text-align:center;">
              <h2 style="margin:0;font-size:22px;color:#333333;font-weight:700;">${book_title}</h2>
            </td>
          </tr>

          <!-- Description -->
          <tr>
            <td style="padding:0 30px 25px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:#555555;text-align:center;">
                ${description}
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 30px 35px;">
              <a href="${amazon_url}" target="_blank" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#ff9a00 0%,#ff6b00 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;border-radius:8px;box-shadow:0 4px 12px rgba(255,107,0,0.3);">
                Voir sur Amazon
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fa;padding:20px 30px;text-align:center;border-top:1px solid #e9ecef;">
              <p style="margin:0;font-size:12px;color:#999999;">
                Vous recevez cet email car vous êtes inscrit sur encremagique.org<br/>
                <a href="#" style="color:#667eea;text-decoration:underline;">Se désinscrire</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
