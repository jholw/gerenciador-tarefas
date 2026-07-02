import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f1724; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
        <h1 style="color: #22d3ee; font-size: 24px; margin: 0;">TaskFlow</h1>
      </div>
      <div style="background: #1a2332; border-radius: 12px; padding: 30px; border: 1px solid #2a3441;">
        <h2 style="color: #fff; font-size: 20px; margin: 0 0 10px 0;">Recuperação de Senha</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">Olá <strong style="color: #fff;">${name}</strong>,</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Recebemos uma solicitação de recuperação de senha para sua conta no <strong style="color: #22d3ee;">Daily Task Manager</strong>.
          Clique no botão abaixo para redefinir sua senha:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #fff; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px;">
            Redefinir Senha
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.6;">
          Este link expira em <strong>1 hora</strong>. Se você não solicitou a recuperação de senha, ignore este email.
        </p>
        <hr style="border: none; border-top: 1px solid #2a3441; margin: 20px 0;" />
        <p style="color: #475569; font-size: 11px; text-align: center;">
          © 2026 TaskFlow - Daily Task Generator. Todos os direitos reservados.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: config.email.from,
    to: email,
    subject: 'Recuperação de Senha - Daily Task Manager',
    html,
  });
}