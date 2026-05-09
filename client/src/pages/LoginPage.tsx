import { AuthPageFrame } from "../modules/auth/AuthPageFrame";
import { LoginForm } from "../modules/auth/LoginForm";

export function LoginPage() {
  return (
    <AuthPageFrame
      eyebrow="Flood Rescue System"
      title="Login to continue"
      description="Use your backend account to access the shared workspace and test the current API contract."
      alternatePrompt="Need a new account?"
      alternateHref="/register"
      alternateLabel="Register here"
    >
      <LoginForm />
    </AuthPageFrame>
  );
}
