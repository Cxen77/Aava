import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";

export class FirebaseGoogleDto {
  idToken: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("firebase-google")
  @HttpCode(HttpStatus.OK)
  async authenticateFirebaseGoogle(@Body() body: FirebaseGoogleDto) {
    return this.authService.authenticateWithFirebase(body.idToken);
  }
}
