/**
 * Auth - Sistema de Autenticação
 * Suporta login com Google OAuth e criação de conta local
 */

const AUTH_SETTINGS_KEY = 'auth_settings';
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Substituir pelo Client ID real do Google Cloud Console

class Auth {
  constructor() {
    this.currentUser = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    // Carrega sessão do localStorage
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
    
    this.initialized = true;
  }

  async loginWithGoogle() {
    return new Promise((resolve, reject) => {
      // Carrega a API do Google Identity Services
      this._loadGoogleAPI()
        .then(() => {
          const client = google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            ux_mode: 'popup',
            callback: async (response) => {
              if (response.code) {
                try {
                  // Troca o código por informações do usuário
                  const userInfo = await this._exchangeCodeForUserInfo(response.code);
                  const user = await this._handleGoogleUser(userInfo);
                  resolve(user);
                } catch (err) {
                  reject(err);
                }
              } else {
                reject(new Error('Falha na autenticação com Google'));
              }
            },
            error_callback: (error) => {
              reject(error);
            }
          });
          client.requestCode();
        })
        .catch(reject);
    });
  }

  _loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined') {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar Google API'));
      document.head.appendChild(script);
    });
  }

  async _exchangeCodeForUserInfo(code) {
    // Em produção, isso deve ser feito no backend
    // Para versão local, decodificamos o token JWT manualmente
    
    // Fallback: Usar Google Identity Services para obter informações
    return new Promise((resolve, reject) => {
      try {
        // Tenta usar o token
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
              // Busca informações do usuário
              fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              })
                .then(res => res.json())
                .then(data => resolve({ id: data.id, email: data.email, name: data.name, picture: data.picture }))
                .catch(err => reject(err));
            } else {
              reject(new Error('Falha ao obter token'));
            }
          }
        });
        tokenClient.requestAccessToken();
      } catch (e) {
        reject(e);
      }
    });
  }

  async _handleGoogleUser(googleInfo) {
    // Verifica se usuário já existe
    let users = await db.getByIndex(STORES.USERS, 'googleId', googleInfo.id);
    
    if (users && users.length > 0) {
      const user = users[0];
      user.lastLogin = new Date().toISOString();
      user.picture = googleInfo.picture || user.picture;
      await db.put(STORES.USERS, user);
      this.currentUser = user;
      this._saveSession(user);
      return user;
    }
    
    // Verifica se já existe com mesmo email
    users = await db.getByIndex(STORES.USERS, 'email', googleInfo.email);
    if (users && users.length > 0) {
      const user = users[0];
      user.googleId = googleInfo.id;
      user.lastLogin = new Date().toISOString();
      user.picture = googleInfo.picture || user.picture;
      user.emailVerified = true;
      await db.put(STORES.USERS, user);
      this.currentUser = user;
      this._saveSession(user);
      return user;
    }
    
    // Cria novo usuário
    const newUser = {
      id: 'google_' + googleInfo.id,
      name: googleInfo.name,
      email: googleInfo.email,
      googleId: googleInfo.id,
      picture: googleInfo.picture || '',
      password: '', // Sem senha para login social
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      emailVerified: true,
      preferences: {
        theme: 'dark',
        notifications: true,
        emailReminders: false,
        kanbanColumns: ['backlog', 'to-do', 'in-progress', 'review', 'done']
      }
    };
    
    await db.add(STORES.USERS, newUser);
    this.currentUser = newUser;
    this._saveSession(newUser);
    return newUser;
  }

  async register(name, email, password) {
    // Validações
    if (!name || !email || !password) {
      throw new Error('Todos os campos são obrigatórios');
    }
    
    if (password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres');
    }
    
    if (!this._validateEmail(email)) {
      throw new Error('Email inválido');
    }
    
    // Verifica se email já está em uso
    const existingUsers = await db.getByIndex(STORES.USERS, 'email', email);
    if (existingUsers && existingUsers.length > 0) {
      throw new Error('Este email já está cadastrado');
    }
    
    // Cria hash da senha (simplificado - em produção usar bcrypt no backend)
    const hashedPassword = await this._hashPassword(password);
    
    const newUser = {
      id: 'user_' + Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      googleId: '',
      picture: '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      emailVerified: false,
      preferences: {
        theme: 'dark',
        notifications: true,
        emailReminders: false,
        kanbanColumns: ['backlog', 'to-do', 'in-progress', 'review', 'done']
      }
    };
    
    await db.add(STORES.USERS, newUser);
    this.currentUser = newUser;
    this._saveSession(newUser);
    return newUser;
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }
    
    const users = await db.getByIndex(STORES.USERS, 'email', email);
    
    if (!users || users.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    const user = users[0];
    
    // Verifica senha
    const isValid = await this._verifyPassword(password, user.password);
    if (!isValid) {
      throw new Error('Senha incorreta');
    }
    
    user.lastLogin = new Date().toISOString();
    await db.put(STORES.USERS, user);
    
    this.currentUser = user;
    this._saveSession(user);
    return user;
  }

  async logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async updateProfile(updates) {
    if (!this.currentUser) throw new Error('Usuário não está logado');
    
    const user = await db.get(STORES.USERS, this.currentUser.id);
    if (!user) throw new Error('Usuário não encontrado');
    
    Object.assign(user, updates);
    user.lastLogin = new Date().toISOString();
    
    await db.put(STORES.USERS, user);
    this.currentUser = user;
    this._saveSession(user);
    return user;
  }

  async getAllUsers() {
    return await db.getAll(STORES.USERS);
  }

  async getUserById(userId) {
    return await db.get(STORES.USERS, userId);
  }

  _saveSession(user) {
    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      preferences: user.preferences
    };
    localStorage.setItem('currentUser', JSON.stringify(sessionData));
    
    // Dispara evento de login
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: sessionData } }));
  }

  async _hashPassword(password) {
    // Hash SHA-256 simplificado para ambiente local
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async _verifyPassword(password, hash) {
    const hashed = await this._hashPassword(password);
    return hashed === hash;
  }

  _validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}

// Singleton
const auth = new Auth();
window.auth = auth;