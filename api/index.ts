import "dotenv/config";
import { createAppServer } from "../server/app";

let appPromise: Promise<import("express").Express> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = createAppServer().then(({ app }) => app);
  }

  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
