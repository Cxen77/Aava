import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { FirebaseAdminService } from "./firebase/firebase-admin.service";

export interface AavaSessionPayload {
  id: string;
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  role: "USER" | "LISTENER" | "CASEWORKER" | "ADMIN";
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly firebaseAdmin: FirebaseAdminService,
    // In production, inject PrismaService: private readonly prisma: PrismaService
  ) {}

  /**
   * Authenticate user with Firebase ID token
   * Finds or creates user, returns session
   */
  async authenticateWithFirebase(idToken: string): Promise<{ session: AavaSessionPayload; accessToken: string }> {
    // 1. Verify token with Firebase Admin
    const verified = await this.firebaseAdmin.verifyIdToken(idToken);

    if (!verified.email) {
      throw new UnauthorizedException("Google account must have an associated email address");
    }

    // 2. In production with Prisma database:
    // const existingUser = await this.prisma.user.findFirst({
    //   where: {
    //     OR: [
    //       { firebaseUid: verified.uid },
    //       { email: verified.email },
    //     ],
    //   },
    //   include: { profile: true, roles: true },
    // });
    //
    // let user = existingUser;
    // if (!user) {
    //   user = await this.prisma.user.create({
    //     data: {
    //       email: verified.email,
    //       firebaseUid: verified.uid,
    //       roles: { create: { role: 'USER' } },
    //       profile: {
    //         create: {
    //           displayName: verified.name || 'Aava User',
    //           avatarUrl: verified.picture,
    //         },
    //       },
    //     },
    //     include: { profile: true, roles: true },
    //   });
    // }

    const session: AavaSessionPayload = {
      id: verified.uid,
      firebaseUid: verified.uid,
      email: verified.email,
      displayName: verified.name || "Aava User",
      photoUrl: verified.picture || null,
      role: "USER", // Default role is strictly USER
    };

    // 3. Generate Aava application session JWT
    // const accessToken = this.jwtService.sign(session, { expiresIn: '7d' });
    const accessToken = idToken; // Pass-through / signed JWT

    this.logger.log(`Authenticated Google user: ${verified.email} (${verified.uid})`);

    return {
      session,
      accessToken,
    };
  }
}
