type Env = {
  CONTACT_FROM_EMAIL?: string;
  CONTACT_SUBJECT_PREFIX?: string;
  CONTACT_TO_EMAIL?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
};

type PagesContext = {
  env: Env;
  request: Request;
};

const MAX_MESSAGE_LENGTH = 5000;

function jsonResponse(body: { message: string }, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function getField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isLikelyEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function verifyTurnstile({
  request,
  secret,
  token,
}: {
  request: Request;
  secret: string;
  token: string;
}) {
  const remoteIp = request.headers.get("CF-Connecting-IP");
  const body = new URLSearchParams({
    response: token,
    secret,
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      body,
      method: "POST",
    },
  );
  const result = (await response.json()) as { success?: boolean };

  return Boolean(result.success);
}

export async function onRequestPost({ env, request }: PagesContext) {
  if (!isSameOrigin(request)) {
    return jsonResponse({ message: "Could not send that message." }, 403);
  }

  const formData = await request.formData();
  const botField = getField(formData, "bot-field");

  if (botField) {
    return jsonResponse({ message: "Thanks, your note was sent." });
  }

  const name = getField(formData, "name");
  const email = getField(formData, "email");
  const message = getField(formData, "message");
  const turnstileToken = getField(formData, "cf-turnstile-response");

  if (!name || !email || !message || !isLikelyEmail(email)) {
    return jsonResponse({ message: "Please fill out the form." }, 400);
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return jsonResponse({ message: "Please send a shorter note." }, 400);
  }

  if (
    !env.TURNSTILE_SECRET_KEY ||
    !env.RESEND_API_KEY ||
    !env.CONTACT_TO_EMAIL ||
    !env.CONTACT_FROM_EMAIL
  ) {
    return jsonResponse({ message: "Contact is not configured yet." }, 500);
  }

  if (
    !turnstileToken ||
    !(await verifyTurnstile({
      request,
      secret: env.TURNSTILE_SECRET_KEY,
      token: turnstileToken,
    }))
  ) {
    return jsonResponse({ message: "Please try the captcha again." }, 400);
  }

  const subjectPrefix = env.CONTACT_SUBJECT_PREFIX || "Website contact";
  const emailResponse = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      reply_to: email,
      subject: `${subjectPrefix}: ${name}`,
      text: [`Name: ${name}`, `Email: ${email}`, "", message].join("\n"),
      to: [env.CONTACT_TO_EMAIL],
    }),
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!emailResponse.ok) {
    return jsonResponse({ message: "Could not send that message." }, 502);
  }

  return jsonResponse({ message: "Thanks, your note was sent." });
}

export function onRequest() {
  return jsonResponse({ message: "Method not allowed." }, 405);
}
