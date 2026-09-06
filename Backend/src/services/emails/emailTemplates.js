function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeName(name) {
  const value = String(name || "there").trim();
  return value || "there";
}

function welcomeEmail({
  name = "there",
  email = "",
  loginUrl = "http://localhost:5173/login",
  supportEmail = "support@connectly.app",
} = {}) {
  const safeName = escapeHtml(normalizeName(name));
  const safeEmail = escapeHtml(email);
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeSupportEmail = escapeHtml(supportEmail);

  return {
    subject: "Welcome to Connectly",
    text: [
      `Welcome to Connectly, ${normalizeName(name)}!`,
      "",
      "Your account is ready. Connect with the people and communities that matter to you.",
      "",
      `Get started: ${loginUrl}`,
      "",
      `Need help? Contact ${supportEmail}.`,
    ].join("\n"),
    html: `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta name="color-scheme" content="light">
		<title>Welcome to Connectly</title>
		<style>
			@media only screen and (max-width: 620px) {
				.email-shell { width: 100% !important; }
				.email-content { padding: 36px 24px !important; }
				.email-heading { font-size: 34px !important; line-height: 1.1 !important; }
			}
		</style>
	</head>
	<body style="margin:0; padding:0; background:#eef4f1; color:#17332e; font-family:Arial, Helvetica, sans-serif;">
		<div role="article" aria-roledescription="email" aria-label="Welcome to Connectly" style="background:#eef4f1; padding:32px 16px;">
			<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
				<tr>
					<td align="center">
						<table role="presentation" class="email-shell" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%; max-width:600px; background:#ffffff; border-radius:20px; overflow:hidden;">
							<tr>
								<td style="height:8px; background:#e86d4f; font-size:0; line-height:0;">&nbsp;</td>
							</tr>
							<tr>
								<td class="email-content" style="padding:48px 56px 52px;">
									<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
										<tr>
											<td style="font-size:22px; font-weight:700; letter-spacing:0.2px; color:#17332e;">connectly<span style="color:#e86d4f;">.</span></td>
										</tr>
										<tr>
											<td style="padding-top:54px;">
												<div style="display:inline-block; padding:8px 12px; border-radius:999px; background:#e6f4ee; color:#27735e; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">You are in</div>
											</td>
										</tr>
										<tr>
											<td class="email-heading" style="padding-top:18px; color:#17332e; font-size:42px; font-weight:700; line-height:1.08; letter-spacing:-1px;">Welcome, ${safeName}.</td>
										</tr>
										<tr>
											<td style="padding-top:20px; color:#58706a; font-size:16px; line-height:1.7;">Your Connectly account is ready. Find your people, build meaningful connections, and keep every conversation moving forward.</td>
										</tr>
										<tr>
											<td style="padding-top:30px;">
												<table role="presentation" cellpadding="0" cellspacing="0" border="0">
													<tr>
														<td style="border-radius:10px; background:#e86d4f;">
															<a href="${safeLoginUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:15px 24px; border:1px solid #e86d4f; border-radius:10px; color:#ffffff; font-size:15px; font-weight:700; text-decoration:none;">Open Connectly &rarr;</a>
														</td>
													</tr>
												</table>
											</td>
										</tr>
										<tr>
											<td style="padding-top:36px;">
												<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e4ece8;">
													<tr>
														<td style="padding-top:24px; color:#80918c; font-size:13px; line-height:1.7;">This email was sent to ${safeEmail || "your registered email address"}. If you need a hand, email <a href="mailto:${safeSupportEmail}" style="color:#27735e; text-decoration:underline;">${safeSupportEmail}</a>.</td>
													</tr>
												</table>
											</td>
										</tr>
									</table>
								</td>
							</tr>
						</table>
						<div style="padding:20px 16px 0; color:#80918c; font-size:12px; line-height:1.6;">&copy; ${new Date().getFullYear()} Connectly. All rights reserved.</div>
					</td>
				</tr>
			</table>
		</div>
	</body>
</html>`,
  };
}

module.exports = { welcomeEmail };
