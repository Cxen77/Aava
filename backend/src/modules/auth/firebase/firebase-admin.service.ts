import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import * as admin from "firebase-admin";

export interface VerifiedFirebaseUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
}

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private firebaseApp: admin.app.App;

  constructor() {
    this.initializeFirebaseAdmin();
  }

  private initializeFirebaseAdmin(): void {
    if (admin.apps.length > 0) {
      this.firebaseApp = admin.app();
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || "aava-93398";
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    try {
      if (privateKey && clientEmail) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        this.logger.log(`Firebase Admin initialized with service account for project: ${projectId}`);
      } else {
        // Fallback to Google Application Default Credentials
        this.firebaseApp = admin.initializeApp({
          projectId,
        });
        this.logger.log(`Firebase Admin initialized with default credentials for project: ${projectId}`);
      }
    } catch (err: any) {
      this.logger.error(`Failed to initialize Firebase Admin: ${err.message}`);
    }
  }

  /**
   * Verify Firebase ID Token securely
   * Verifies: signature, expiration, issuer (https://securetoken.google.com/aava-93398), and audience
   */
  async verifyIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
    if (!idToken) {
      throw new UnauthorizedException("Missing Firebase ID token");
    }

    try {
      const decoded = await admin.auth(this.firebaseApp).verifyIdToken(idToken, true);

      // Verify audience and issuer
      const expectedProjectId = process.env.FIREBASE_PROJECT_ID || "aava-93398";
      if (decoded.aud !== expectedProjectId) {
        throw new UnauthorizedException("Invalid token audience");
      }

      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        emailVerified: decoded.email_verified,
      };
    } catch (error: any) {
      this.logger.warn(`Firebase token verification failed: ${error.message}`);
      throw new UnauthorizedException("Invalid or expired Firebase ID token");
    }
  }
}
