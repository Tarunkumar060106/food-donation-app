import { startSession } from "../start-session";

export async function POST(request: Request) {
  return startSession("login", request);
}
