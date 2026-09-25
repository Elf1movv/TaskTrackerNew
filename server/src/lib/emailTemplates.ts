// Branded HTML for the two auth emails (server/src/auth.ts). Deliberately
// inline styles + a table layout, not the app's own Tailwind/CSS — email
// clients don't load external stylesheets or support most modern CSS, so
// this has to be written the old way to render consistently across
// clients. Colors/fonts are copied from src/styles/theme.css's light
// palette by hand (no way to share that file across the workspace
// boundary into an email that must also survive with no CSS variables).
// The button is a plain <a> inside a colored table cell (works in Gmail,
// Apple Mail, Outlook.com, mobile clients) — no VML fallback for Outlook
// desktop specifically; that renders a slightly plainer button there but
// stays clickable, judged not worth the extra complexity for this app's
// scale. User-approved design, see the reviewed preview before this was
// wired in.

const FOOTER_STYLE = "margin:0;font-size:11px;line-height:1.6;color:#a89e8f;"

function wrap(bodyHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f0;padding:40px 20px;font-family:'Inter',Arial,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="padding:36px 36px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c97b3a;font-weight:700;">
                  🔥 MYTRACKER
                </td>
              </tr>
            </table>
          </td>
        </tr>
        ${bodyHtml}
      </table>
    </td>
  </tr>
</table>`
}

function button(href: string, label: string): string {
  return `<tr>
          <td style="padding:0 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-radius:10px;background:#c97b3a;">
                  <a href="${href}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:500;color:#fdf6ef;text-decoration:none;border-radius:10px;">
                    ${label}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
}

function fallbackLink(url: string): string {
  return `<p style="margin:0 0 24px;font-size:12px;line-height:1.6;color:#8a8074;">
              Если кнопка не открывается, скопируйте ссылку в браузер:<br>
              <span style="word-break:break-all;color:#8a8074;">${url}</span>
            </p>
            <div style="height:1px;background:#efe7db;margin:0 0 22px;"></div>`
}

export function verificationEmailHtml(url: string): string {
  return wrap(`<tr>
          <td style="padding:14px 36px 0;">
            <h1 style="margin:0 0 18px;font-family:'Roboto Slab',Georgia,serif;font-weight:700;font-size:24px;line-height:1.3;color:#241f19;">
              Добро пожаловать в MyTracker!
            </h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#241f19;">
              Привет! Меня зовут Никита, я разработчик MyTracker — и, надеюсь, в будущем не только его, а целой линейки удобных приложений.
            </p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#241f19;">
              Спасибо, что решили попробовать сервис. Искренне надеюсь, что он вам понравится и поможет стать продуктивнее — лучше планировать задачи, привычки и цели. Если благодаря MyTracker жизнь станет хоть немного проще — я уже стараюсь не зря.
            </p>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#241f19;">
              Чтобы начать, подтвердите почту:
            </p>
          </td>
        </tr>
        ${button(url, "Подтвердить почту")}
        <tr>
          <td style="padding:22px 36px 0;">
            ${fallbackLink(url)}
            <p style="margin:0 0 16px;font-size:14px;line-height:1.65;color:#241f19;">
              Если столкнётесь с багом, что-то пойдёт не так, как ожидалось, или просто появится идея, как сделать сервис лучше — не стесняйтесь, напишите мне через форму обратной связи внизу любой страницы сайта. Обязательно разберусь и постараюсь всё поправить. Ваше мнение правда очень важно для развития проекта.
            </p>
            <p style="margin:0 0 30px;font-size:14px;line-height:1.65;color:#241f19;">
              Спасибо, что вы со мной!<br>
              <span style="font-weight:500;">Никита</span>, разработчик MyTracker
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 36px 28px;border-top:1px solid #efe7db;">
            <p style="${FOOTER_STYLE}">
              MyTracker · mytracker.space<br>
              Письмо отправлено, потому что этот адрес указали при регистрации.
            </p>
          </td>
        </tr>`)
}

export function resetPasswordEmailHtml(url: string): string {
  return wrap(`<tr>
          <td style="padding:14px 36px 0;">
            <h1 style="margin:0 0 18px;font-family:'Roboto Slab',Georgia,serif;font-weight:700;font-size:24px;line-height:1.3;color:#241f19;">
              Восстановление пароля
            </h1>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#241f19;">
              Привет! Чтобы задать новый пароль для аккаунта MyTracker, нажмите на кнопку ниже:
            </p>
          </td>
        </tr>
        ${button(url, "Сбросить пароль")}
        <tr>
          <td style="padding:22px 36px 0;">
            ${fallbackLink(url)}
            <p style="margin:0 0 16px;font-size:14px;line-height:1.65;color:#241f19;">
              Если вы не запрашивали восстановление пароля — просто проигнорируйте это письмо, аккаунт останется в безопасности.
            </p>
            <p style="margin:0 0 30px;font-size:14px;line-height:1.65;color:#241f19;">
              Если возникнут вопросы — форма обратной связи внизу любой страницы сайта, буду рад помочь.<br>
              <span style="font-weight:500;">— Никита</span>, разработчик MyTracker
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 36px 28px;border-top:1px solid #efe7db;">
            <p style="${FOOTER_STYLE}">
              MyTracker · mytracker.space<br>
              Письмо отправлено по запросу восстановления пароля с этого адреса.
            </p>
          </td>
        </tr>`)
}
