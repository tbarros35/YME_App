import nodemailer, { Transporter } from 'nodemailer';

export class EmailService {
  private static transporter: Transporter | null = null;

  private static getTransporter(): Transporter | null {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      return null;
    }

    if (!this.transporter) {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = Number(process.env.SMTP_PORT) || 465;
      const isSecure = port === 465;

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: {
          user,
          pass,
        },
      });
    }

    return this.transporter;
  }

  /**
   * Envia email de boas-vindas com as credenciais de acesso ao novo membro criado
   */
  static async sendWelcomeEmail(data: {
    to: string;
    fullName: string;
    tempPassword: string;
    departmentName: string;
    position: string;
  }): Promise<boolean> {
    const transporter = this.getTransporter();
    const appUrl = process.env.APP_URL || 'https://app.yme.pt';
    const fromAddress = process.env.SMTP_FROM || `"YME - Young Minho Enterprise" <${process.env.SMTP_USER || 'geral@yme.pt'}>`;

    if (!transporter) {
      console.log(`ℹ️ [EmailService] SMTP não configurado. Email de boas-vindas para ${data.to} ignorado.`);
      return false;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <title>Bem-vindo à YME App</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #151e33;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(21, 30, 51, 0.05);">
    
    <!-- Header -->
    <div style="background-color: #151e33; padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">YME PORTAL</h1>
      <p style="color: rgba(255, 255, 255, 0.7); margin: 6px 0 0; font-size: 13px;">Plataforma Integrada de Gestão de Membros & Progressão</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 12px; color: #151e33;">Olá, ${data.fullName}! 👋</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
        A tua conta na plataforma interna da <strong>Young Minho Enterprise</strong> foi criada com sucesso pela Direção. A partir de agora, podes aceder ao portal para consultar os teus relatórios SAD, gerir reembolsos da tua Carteira YME e aceder a informações de equipa.
      </p>

      <!-- Department Badge -->
      <div style="background-color: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px;">
        <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Alocação Oficial</span>
        <span style="font-size: 15px; font-weight: 700; color: #151e33;">${data.position}</span>
        <span style="font-size: 14px; color: #64748b;"> &bull; ${data.departmentName}</span>
      </div>

      <!-- Credentials Box -->
      <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
        <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #7e22ce; margin: 0 0 14px;">
          🔑 As tuas credenciais de acesso
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #6b21a8; font-weight: 600; width: 140px;">Email de Login:</td>
            <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #151e33;">${data.to}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b21a8; font-weight: 600;">Palavra-passe:</td>
            <td style="padding: 6px 0; font-family: monospace; font-weight: 700; color: #151e33; background: #f3e8ff; display: inline-block; padding: 2px 8px; border-radius: 6px;">${data.tempPassword}</td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin-bottom: 28px;">
        <a href="${appUrl}/login" target="_blank" style="display: inline-block; background-color: #151e33; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 6px rgba(21, 30, 51, 0.2);">
          Aceder à YME App &rarr;
        </a>
      </div>

      <!-- Security Notice -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
        <p style="font-size: 12px; line-height: 1.5; color: #94a3b8; margin: 0;">
          💡 <strong>Recomendação de Segurança:</strong> A palavra-passe acima é provisória. Por razões de segurança, recomendamos que a alteres após o primeiro acesso acedendo às tuas definições de perfil.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 11px; color: #94a3b8; margin: 0;">
        Young Minho Enterprise &bull; Universidade do Minho &bull; <a href="https://app.yme.pt" style="color: #64748b; text-decoration: underline;">app.yme.pt</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: data.to,
        subject: `Bem-vindo à YME App! Os teus dados de acesso`,
        html: htmlContent,
      });
      console.log(`✅ [EmailService] Email de boas-vindas enviado com sucesso para ${data.to}`);
      return true;
    } catch (err: any) {
      console.error(`❌ [EmailService] Erro ao enviar email para ${data.to}:`, err.message);
      return false;
    }
  }

  /**
   * Envia email de notificação quando a palavra-passe é redefinida por um administrador
   */
  static async sendPasswordResetEmail(data: {
    to: string;
    fullName: string;
    newPassword: string;
  }): Promise<boolean> {
    const transporter = this.getTransporter();
    const appUrl = process.env.APP_URL || 'https://app.yme.pt';
    const fromAddress = process.env.SMTP_FROM || `"YME - Young Minho Enterprise" <${process.env.SMTP_USER || 'geral@yme.pt'}>`;

    if (!transporter) {
      console.log(`ℹ️ [EmailService] SMTP não configurado. Notificação para ${data.to} ignorada.`);
      return false;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <title>Palavra-passe Redefinida - YME App</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #151e33;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(21, 30, 51, 0.05);">
    
    <div style="background-color: #151e33; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">YME PORTAL</h1>
    </div>

    <div style="padding: 32px 24px;">
      <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 12px; color: #151e33;">Olá, ${data.fullName}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
        A tua palavra-passe de acesso ao <strong>YME Portal</strong> foi redefinida por um administrador.
      </p>

      <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <span style="font-size: 12px; color: #6b21a8; font-weight: 600; display: block; margin-bottom: 6px;">Nova Palavra-passe Provisória:</span>
        <span style="font-family: monospace; font-size: 16px; font-weight: 800; color: #151e33; background: #f3e8ff; padding: 4px 10px; border-radius: 6px;">${data.newPassword}</span>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${appUrl}/login" target="_blank" style="display: inline-block; background-color: #151e33; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px;">
          Entrar na Conta &rarr;
        </a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin: 0;">
        Se não solicitaste esta redefinição, contacta de imediato a Direção da YME.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: data.to,
        subject: `YME App - A tua palavra-passe foi redefinida`,
        html: htmlContent,
      });
      console.log(`✅ [EmailService] Notificação de reset de password enviada para ${data.to}`);
      return true;
    } catch (err: any) {
      console.error(`❌ [EmailService] Erro ao enviar email de reset para ${data.to}:`, err.message);
      return false;
    }
  }
}
