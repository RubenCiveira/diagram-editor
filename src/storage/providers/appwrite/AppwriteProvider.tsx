import React, { ComponentType } from 'react';
import { FileStorage, Repository, Storage } from '../../Repository';
import AccessGate from './ui/AccessGate/AccessGate';
import AppwriteAuth from './ui/AppwriteAuth/AppwriteAuth';
import { account, client } from './AppwriteConnector';
import { DiagramModel } from '../../../diagram';
import { Account, Databases, Models, Query } from 'appwrite';
import { APPWRITE_CONFIG } from '../../../app/FeatureFlags';

const databases = new Databases(client!);

export class AppwriteProvider implements Storage {
  manager(): ComponentType<any> | null | undefined {
    return null;
  }

  listRepositories(): Repository[] | Promise<Repository[]> {
    return this.doListRepositories();
  }

  gateComponent(): null | ComponentType<{ onReady: () => void }> {
    // Devolvemos un componente “gate” que decide si bloquear o pasar
    const Gate: React.FC<{ onReady: () => void }> = ({ onReady }) => {
      const [step, setStep] = React.useState<'intro' | 'auth' | 'verify' | 'role'>('intro');
      const [checked, setChecked] = React.useState(false);
      const [hasSession, setHasSession] = React.useState<boolean | null>(null);

      const verify = React.useCallback(() => {
        let cancelled = false;
        (async () => {
          try {
            const me = await account!.get(); // ok si hay sesión
            if (!cancelled) {
              if (APPWRITE_CONFIG.require?.emailVerified && !me.emailVerification) {
                setHasSession(false);
                setStep('verify');
              } else if (APPWRITE_CONFIG.require?.label && !me.labels.includes(APPWRITE_CONFIG.require?.label)) {
                setHasSession(false);
                setStep('role');
              } else {
                setHasSession(true);
                onReady(); // sesión válida → seguir sin mostrar nada
              }
            }
          } catch {
            if (!cancelled) {
              setHasSession(false); // no sesión → mostrar gate
            }
          } finally {
            if (!cancelled) setChecked(true);
          }
        })();
        return () => {
          cancelled = true;
        };
      }, [onReady, setStep]);

      React.useEffect(() => {
        // let cancelled = false;
        return verify();
        // return () => {
        //   cancelled = true;
        // };
      }, [onReady]);

      if (!checked) {
        // loading breve mientras comprobamos sesión
        return <div className="p-6">Comprobando sesión…</div>;
      }
      if (hasSession) {
        // ya llamó a onAccept; render neutro
        return null;
      }
      // sin sesión → bloquea con el gate (intro → auth)
      return (
        <>
          <p>{step}</p>
          <AccessGate
            onReady={() => {
              verify();
            }}
            setStep={setStep}
            AuthComponent={AppwriteAuth}
            step={step}
            title="Conecta tu Appwrite"
          />
        </>
      );
    };
    return Gate as any;
  }

  private async doListRepositories(): Promise<Repository[]> {
    // const { page = 1, limit = 25, orderBy = '$createdAt', orderDesc = true };

    const ownerId = 'me';
    const page = 1;
    const limit = 25;
    const orderDesc = true;
    const orderBy = '$createdAt';

    const queries: string[] = [
      Query.limit(limit),
      Query.offset(Math.max(0, (page - 1) * limit)),
      orderDesc ? Query.orderDesc(orderBy) : Query.orderAsc(orderBy),
    ];
    let resolvedOwnerId = ownerId;
    if (ownerId === 'me') {
      const me = await account!.get(); // requiere sesión válida
      resolvedOwnerId = me.$id;
    }
    if (resolvedOwnerId) {
      queries.push(Query.equal('ownerId', resolvedOwnerId));
    }
    const res = await databases.listDocuments({databaseId: APPWRITE_CONFIG.database, 
    collectionId: APPWRITE_CONFIG.repositories });

    const mapRepository = function (doc: Models.Document): Repository {
      return new AppwriteRepository({
        account: account!,
        databases: databases,
        dbId: APPWRITE_CONFIG.database,
        filesCollId: APPWRITE_CONFIG.files,
        repoDoc: doc,
      });
    };
    return res.documents.map(mapRepository);
  }
}

export class AppwriteRepository implements Repository {
  private account: Account;
  private databases: Databases;

  private readonly dbId: string;
  private readonly filesCollId: string;

  private readonly repoDoc: Models.Document;

  constructor(params: {
    account: Account;
    databases: Databases;
    dbId: string;
    filesCollId: string;
    repoDoc: Models.Document;
  }) {
    this.account = params.account;
    this.databases = params.databases;
    this.dbId = params.dbId;
    this.filesCollId = params.filesCollId;
    this.repoDoc = params.repoDoc;
  }

  name(): string {
    return (this.repoDoc as any).name as string;
  }

  async listFiles(): Promise<FileStorage[]> {
    console.log("LIST FILES");
    const res = await this.databases.listDocuments(this.dbId, this.filesCollId, [
      Query.equal("repository", this.repoDoc.$id)
      // Puedes añadir queries si usas Appwrite v1/v3: Query.equal("repoId", this.repoDoc.$id)
      // Para mantenerlo compatible sin importar Query:
      // (Appwrite requiere Query.equal; si lo tienes disponible, úsalo)
    ] as any);
    return res.documents.map(
      (doc) =>
        new AppwriteFileStorage({
          account: this.account,
          databases: this.databases,
          dbId: this.dbId,
          filesCollId: this.filesCollId,
          repoDoc: this.repoDoc,
          fileDoc: doc,
        }),
    );
  }

  async createFile(name: string): Promise<FileStorage> {
    // Crea documento vacío con estructura mínima
    const diagram = {
      name: name,
      nodes: [],
      edges: [],
      meta: {},
    };

    const doc = await this.databases.createDocument(this.dbId, this.filesCollId, 'unique()', {
      name: name,
      repository: this.repoDoc.$id,
      json: JSON.stringify( diagram ),
    });

    return new AppwriteFileStorage({
      account: this.account,
      databases: this.databases,
      dbId: this.dbId,
      filesCollId: this.filesCollId,
      repoDoc: this.repoDoc,
      fileDoc: doc,
    });
  }
}

export class AppwriteFileStorage implements FileStorage {
  private account: Account;
  private databases: Databases;

  private readonly dbId: string;
  private readonly filesCollId: string;

  private readonly repoDoc: Models.Document;
  private fileDoc: Models.Document; // mantenemos el último snapshot

  constructor(params: {
    account: Account;
    databases: Databases;
    dbId: string;
    filesCollId: string;
    repoDoc: Models.Document;
    fileDoc: Models.Document;
  }) {
    this.account = params.account;
    this.databases = params.databases;
    this.dbId = params.dbId;
    this.filesCollId = params.filesCollId;
    this.repoDoc = params.repoDoc;
    this.fileDoc = params.fileDoc;
  }

  name(): string {
    return (this.fileDoc as any).name as string;
  }

  fullName(): string {
    return `${(this.repoDoc as any).name}/${this.name()}`;
  }

  async isWritable(): Promise<boolean> {
    // Estrategia simple:
    // 1) si el proyecto usa permisos por documento, verifica si el usuario actual tiene write/update
    // 2) si no hay permisos específicos, asumimos writable
    try {
      const me = await this.account.get();
      const uid = me.$id;

      // En Appwrite moderno, los permisos por documento pueden estar en $permissions
      const perms = (this.fileDoc as any).$permissions as string[] | undefined;
      if (!perms || perms.length === 0) return true;

      // Heurística: busca permisos 'update' o 'write' para el usuario o team
      const has =
        perms.some((p) => p.includes('update("user:') && p.includes(uid)) ||
        perms.some((p) => p.includes('write("user:') && p.includes(uid));

      return has;
    } catch {
      // si no podemos saber, mejor false
      return false;
    }
  }

  async delete(): Promise<void> {
    await this.databases.deleteDocument(this.dbId, this.filesCollId, this.fileDoc.$id);
  }

  async read(): Promise<DiagramModel> {
    // refresca el doc por si hay cambios
    const fresh = await this.databases.getDocument(this.dbId, this.filesCollId, this.fileDoc.$id);
    this.fileDoc = fresh;
    // el campo "diagram" guarda el JSON del diagrama
    
    return JSON.parse((fresh as any).json) as DiagramModel;
  }

  async write(diagram: DiagramModel): Promise<void> {
    const updated = await this.databases.updateDocument(this.dbId, this.filesCollId, this.fileDoc.$id, {
      json: JSON.stringify(diagram),
    });
    this.fileDoc = updated;
  }
}

