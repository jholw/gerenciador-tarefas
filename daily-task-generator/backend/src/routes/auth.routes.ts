import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../config';

const router = Router();

// Configuração do Passport Google
if (config.google.clientId) {
  passport.use(new GoogleStrategy({
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackUrl,
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    const googleUser = {
      id: profile.id,
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
    };
    return done(null, googleUser);
  }));

  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }));

  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${config.frontendUrl}/login` }),
    authController.googleCallback
  );
}

// Rotas de autenticação
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Rotas de recuperação de senha
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rotas de perfil (autenticadas)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.get('/users', authenticate, authController.getAllUsers);

export default router;