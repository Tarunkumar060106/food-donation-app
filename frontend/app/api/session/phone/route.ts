import { startSession } from "../start-session";

/** Phone.email OTP sign-in: the body carries the user_json_url, which Spring verifies. */
export async function POST(request: Request) {
  return startSession("phone", request);
}
