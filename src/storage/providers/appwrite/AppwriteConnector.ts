import { Account, Client } from 'appwrite';
import { APPWRITE_CONFIG, FEATURE_FLAGS } from '../../../app/FeatureFlags';

export const [client, account] = connect();

function connect(): [Client?, Account?] {
  if (FEATURE_FLAGS.appWriteRepo) {
    const client = new Client();
    client.setEndpoint(APPWRITE_CONFIG.endpoint).setProject(APPWRITE_CONFIG.project);
    const account = new Account(client); // Export an Account instance initialized with the client
    return [client, account];
  } else {
    return [undefined, undefined];
  }
}

async function AuthCallback(toError?: string) {
  (async () => {
    const p = new URLSearchParams(window.location.search);
    const on = p.get('on') ?? 'login';
    if (on === 'verify') {
      const userId = p.get('userId');
      const secret = p.get('secret');
      const expire = p.get('expire');
      if (userId && secret && expire) {
        await account!.updateVerification({ userId: userId, secret: secret });
        // 4) Limpiar la URL y redirigir donde quieras
        window.history.replaceState({}, '', '/');
        // p.ej. ya puedes hacer: const me = await account.get();
        window.location.reload();
      } else if (toError) {
        // nada que canjear
        window.location.replace(toError + '?error=missing_oauth_params');
      }
    } else if (on === 'login') {
      const userId = p.get('userId');
      const secret = p.get('secret');
      if (userId && secret) {
        // 2) Intercambiar userId+secret por sesión (no dependemos de cookie)
        const session = await account!.createSession({ userId, secret });

        // 3a) Autenticar el cliente por sesión sin cookie:
        client!.setSession(session.secret); // todas las llamadas del SDK ya van autenticadas

        // (opcional) 3b) Cambiar a JWT y olvidarte de la sesión/cookies
        // const { jwt } = await account.createJWT();
        // client.setJWT(jwt);
        // sessionStorage.setItem("appwrite_jwt", jwt);

        // 4) Limpiar la URL y redirigir donde quieras
        window.history.replaceState({}, '', '/');
        // p.ej. ya puedes hacer: const me = await account.get();
        window.location.reload();
      } else if (toError) {
        // nada que canjear
        window.location.replace(toError + '?error=missing_oauth_params');
      }
    }
  })().catch((e) => {
    console.error('OAuth callback error', e);
    if (toError) {
      window.location.replace(toError + '?error=oauth_exchange_failed');
    }
  });
}

AuthCallback();

// Inyecta el JWT en el cliente: a partir de aquí el SDK enviará X-Appwrite-JWT
// const { jwt } = await account.createJWT();
// client.setJWT(jwt);
