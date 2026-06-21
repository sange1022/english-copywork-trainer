import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { createTranslator } from "./translation.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const MODULE_DIR = path.join(ROOT, "src");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > 64 * 1024) throw new Error("请求内容过大");
  }
  return JSON.parse(body || "{}");
}

function memoryCache() {
  const values = new Map();
  return {
    get: async (key) => values.get(key),
    set: async (key, value) => values.set(key, value)
  };
}

function defaultTranslator() {
  if (process.env.COPYWORK_FAKE_TRANSLATION === "1") {
    return {
      translateSentence: async (sentence) => ({
        text: `翻译：${sentence}`,
        available: true
      }),
      lookupWord: async (word) => ({
        word: word.toLowerCase(),
        meaning: `释义：${word.toLowerCase()}`,
        available: true
      })
    };
  }
  return createTranslator({ cache: memoryCache() });
}

async function serveStatic(requestPath, response) {
  let base = PUBLIC_DIR;
  let relative = requestPath === "/" ? "index.html" : requestPath.slice(1);

  if (requestPath.startsWith("/modules/")) {
    base = MODULE_DIR;
    relative = requestPath.slice("/modules/".length);
  }

  const resolved = path.resolve(base, relative);
  if (!resolved.startsWith(`${base}${path.sep}`)) {
    json(response, 403, { error: "禁止访问" });
    return;
  }

  try {
    const content = await readFile(resolved);
    response.writeHead(200, {
      "content-type": MIME_TYPES[path.extname(resolved)] ?? "application/octet-stream",
      "cache-control": "no-store"
    });
    response.end(content);
  } catch {
    json(response, 404, { error: "未找到页面" });
  }
}

export function createServer({ translator = defaultTranslator() } = {}) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        json(response, 200, { ok: true });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/translate") {
        const { sentences } = await readJson(request);
        if (
          !Array.isArray(sentences) ||
          sentences.length === 0 ||
          sentences.some((sentence) => typeof sentence !== "string" || !sentence.trim()) ||
          sentences.join("").length > 12000
        ) {
          json(response, 400, { error: "请输入有效的英文内容" });
          return;
        }
        const translations = await Promise.all(
          sentences.map((sentence) => translator.translateSentence(sentence))
        );
        json(response, 200, { translations });
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/word") {
        const { word } = await readJson(request);
        if (typeof word !== "string" || !word.trim() || word.length > 80) {
          json(response, 400, { error: "请输入有效单词" });
          return;
        }
        json(response, 200, await translator.lookupWord(word.trim()));
        return;
      }

      if (request.method === "GET") {
        await serveStatic(url.pathname, response);
        return;
      }

      json(response, 404, { error: "未找到接口" });
    } catch {
      json(response, 400, { error: "请求处理失败" });
    }
  });
}

export async function startServer({ preferredPort = 4318, openBrowser = true } = {}) {
  const server = createServer();
  let port = preferredPort;

  while (port <= preferredPort + 10) {
    try {
      await new Promise((resolve, reject) => {
        const onError = (error) => {
          server.off("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          resolve();
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(port, "127.0.0.1");
      });
      break;
    } catch (error) {
      if (error.code !== "EADDRINUSE") throw error;
      port += 1;
    }
  }

  if (!server.listening) throw new Error("没有可用端口");
  const url = `http://127.0.0.1:${port}`;
  console.log(`英文临摹已启动：${url}`);
  if (openBrowser && process.platform === "darwin") execFile("open", [url]);
  return { server, url };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
